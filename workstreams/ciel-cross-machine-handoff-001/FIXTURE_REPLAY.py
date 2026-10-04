"""Comparable local Git probes for a closed experiment; no CIEL write path."""
import argparse
import hashlib
import json
import platform
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="New directory ignored by the enclosing HQ Git")
    output = Path(parser.parse_args().output).resolve()
    if output.exists():
        raise SystemExit("Refusing an existing output directory.")
    ignored = subprocess.run(["git", "check-ignore", "--quiet", str(output / "probe")], capture_output=True)
    if ignored.returncode != 0:
        raise SystemExit("Output must be ignored by HQ Git; use a new .local/ directory.")
    output.mkdir(parents=True)
    log = []

    def git(cwd, *args, expected=0):
        result = subprocess.run(["git", *map(str, args)], cwd=cwd, capture_output=True, text=True)
        log.append({"cwd": str(cwd), "args": list(map(str, args)), "exit": result.returncode,
                    "stdout": result.stdout, "stderr": result.stderr})
        if expected is not None and result.returncode != expected:
            raise AssertionError((args, result.returncode, result.stderr))
        return result

    def text(cwd, *args):
        return git(cwd, *args).stdout.strip()

    def commit(cwd, message):
        git(cwd, "-c", "user.name=CIEL fixture", "-c", "user.email=fixture@example.invalid",
            "commit", "-m", message)
        return text(cwd, "rev-parse", "HEAD")

    def setup(name):
        remote, source, receiver = [output / (name + suffix) for suffix in ["-remote.git", "-source", "-receiver"]]
        git(output, "init", "--bare", "--initial-branch=main", remote)
        git(output, "clone", remote, source)
        (source / "README.md").write_text("Disposable local fixture, not production authority.\n", encoding="utf-8")
        git(source, "add", "--", "README.md")
        commit(source, "fixture baseline")
        git(source, "push", "origin", "main")
        git(output, "clone", "--no-hardlinks", remote, receiver)
        return remote, source, receiver

    def snapshot(cwd):
        return {"head": text(cwd, "rev-parse", "HEAD"), "status": text(cwd, "status", "--porcelain=v1"),
                "files": {str(p.relative_to(cwd)): hashlib.sha256(p.read_bytes()).hexdigest()
                          for p in cwd.rglob("*") if p.is_file() and ".git" not in p.relative_to(cwd).parts}}

    branch = "win/fixture-replay"
    timestamp = datetime.now(timezone.utc).isoformat()

    def record(cwd, name, evidence, result):
        value = {"schema_version": "ciel.event.v0.1", "id": "fixture_" + name, "type": "closeout",
                 "recorded_at": timestamp, "recorded_by": {"human": "fixture", "agent": "fixture-script"},
                 "workstream": {"id": "fixture-task", "lane": "single"},
                 "outcome": {"status": "recorded", "result": result},
                 "evidence": dict(evidence, repository={"head": text(cwd, "rev-parse", "HEAD"), "branch": branch}),
                 "unresolved": ["Script-only fixture; no agent, lock, or product proof."],
                 "next_action": {"action": "Inspect fixture evidence only."}}
        path = "memory/events/" + name + ".yaml"
        target = cwd / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        git(cwd, "add", "--", path)
        return path, commit(cwd, "fixture " + name), value

    try:
        hremote, hs, hr = setup("hq")
        cremote, cs, cr = setup("child")
        baseline = {"hq": snapshot(hr), "child": snapshot(cr)}
        refs = text(hr, "for-each-ref", "--format=%(refname)", "refs/remotes/origin/").splitlines()
        assert all(not text(hr, "ls-tree", "-r", "--name-only", ref, "--", "memory/events/") for ref in refs)
        git(cs, "switch", "-c", branch)
        git(cs, "push", "-u", "origin", branch)
        (cs / "task.txt").write_text("TODO: unfinished fixture task\n", encoding="utf-8")
        git(cs, "add", "--", "task.txt")
        child = commit(cs, "fixture unfinished task")
        # Observe actual task content; the simulated task-check is intentionally red.
        check_exit = int("TODO" in (cs / "task.txt").read_text(encoding="utf-8"))
        assert check_exit == 1
        git(cs, "push", output / "unavailable-child.git", "HEAD:refs/heads/" + branch, expected=128)
        git(cremote, "cat-file", "-e", child + "^{commit}", expected=128)
        git(hs, "switch", "-c", branch)
        evidence = {"execution": {"os": platform.system().lower(), "locality": "local"},
                    "child": {"head": child, "branch": branch}, "check": {"revision": child, "exit_code": check_exit},
                    "handoff": {"publication_verified": False, "source_edits_stopped": True}}
        first_path, first_commit, _ = record(hs, "incomplete", evidence, "publication incomplete; task failed")
        git(hs, "push", "-u", "origin", branch)
        git(hr, "fetch", "origin")
        git(cr, "fetch", "origin")
        received = json.loads(text(hr, "show", "origin/" + branch + ":" + first_path))
        assert received["evidence"]["check"]["exit_code"] == 1
        git(cr, "cat-file", "-e", child + "^{commit}", expected=128)
        git(hr, "merge-base", "--is-ancestor", first_commit, "origin/main", expected=1)
        assert {"hq": snapshot(hr), "child": snapshot(cr)} == baseline
        first_blob = text(hr, "rev-parse", "origin/" + branch + ":" + first_path)

        git(cs, "push", "origin", branch)
        git(cr, "fetch", "origin")
        git(cr, "merge-base", "--is-ancestor", child, "origin/" + branch)
        evidence["handoff"]["publication_verified"] = True
        evidence["preceding_record"] = {"id": "fixture_incomplete", "commit": first_commit}
        offer_path, offer_commit, offer = record(hs, "repaired_offer", evidence, "publication repaired; task still failed")
        git(hs, "push", "origin", branch)
        git(hr, "fetch", "origin")
        assert text(hr, "rev-parse", "origin/" + branch + ":" + first_path) == first_blob
        assert {"hq": snapshot(hr), "child": snapshot(cr)} == baseline
        git(hr, "switch", "-c", branch, "--track", "origin/" + branch)
        git(cr, "switch", "-c", branch, "--track", "origin/" + branch)
        child_before = snapshot(cr)

        def verify_reference(reference):
            probe = git(hr, "show", reference["commit"] + ":" + reference["path"], expected=None)
            return probe.returncode == 0 and json.loads(probe.stdout)["id"] == reference["id"]

        reference = {"id": offer["id"], "commit": offer_commit, "path": offer_path}
        assert verify_reference(reference)
        assert not verify_reference(dict(reference, commit=text(hr, "rev-parse", "origin/main")))
        assert not verify_reference(dict(reference, id="fixture_wrong_id"))
        receipt_path, receipt_commit, _ = record(hr, "receipt", {"receives": reference, "child": {"head": child},
                                                 "check": {"revision": child, "exit_code": 1}},
                                                "verified locally; receipt publication pending")
        receipt_blob = text(hr, "rev-parse", "HEAD:" + receipt_path)
        git(hr, "push", output / "unavailable-hq.git", "HEAD:refs/heads/" + branch, expected=128)
        assert text(hremote, "rev-parse", "refs/heads/" + branch) == offer_commit
        git(hremote, "cat-file", "-e", receipt_commit + "^{commit}", expected=128)
        assert snapshot(cr) == child_before
        git(hr, "push", "origin", branch)
        git(hs, "fetch", "origin")
        git(hs, "merge-base", "--is-ancestor", receipt_commit, "origin/" + branch)
        assert text(hs, "rev-parse", "origin/" + branch + ":" + receipt_path) == receipt_blob
        assert snapshot(cr) == child_before
        # A deliberately late source write leaves old commits reachable but changes scope.
        (cs / "task.txt").write_text("TODO: late source edit after offer\n", encoding="utf-8")
        git(cs, "add", "--", "task.txt")
        late = commit(cs, "fixture adversarial late edit")
        git(cs, "push", "origin", branch)
        git(cr, "fetch", "origin")
        git(cr, "merge-base", "--is-ancestor", child, "origin/" + branch)
        assert "task.txt" in text(cr, "diff", "--name-only", child, "origin/" + branch).splitlines()
        assert snapshot(cr) == child_before
        result = {"result": "PASS: comparable local Git assertions", "os": platform.system().lower(),
                  "cases": ["missing offer on fetched baseline refs", "failed-result transport", "unmerged offer",
                            "partial publication", "append-only repair", "wrong receipt references",
                            "receipt retry", "late scoped write with old commit reachable"],
                  "fixture_revisions": {"child": child, "offer": offer_commit, "receipt": receipt_commit, "late": late},
                  "boundary": "New fixture hashes, script assertions only; no historical replay, agent, lock, SMC, or deployed-rule proof."}
        (output / "result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(result, indent=2))
    finally:
        # Local transcript can contain output paths; it is never published by this runner.
        (output / "transcript.json").write_text(json.dumps(log, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
