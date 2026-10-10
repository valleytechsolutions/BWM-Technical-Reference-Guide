# Workflow failure diagnosis / October 2026

The three historical website failures were separate deployment checks, not missing pinout files. They are already corrected in the current source:

| Failed run | Cause | Existing correction |
|---|---|---|
| [37441691450](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/37441691450) | Initial decoded resources were 15,760,686 bytes, above the 15 MiB browser budget. | Commit `db1291a` moved connector data out of the initial catalog. |
| [37443128258](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/37443128258) | The deployment allowlist rejected the new `pin-connectors.json` public file. | Commit `c50d6dc` added the generated public connector file to the allowlist. |
| [37444307528](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/actions/runs/37444307528) | The post-deployment byte comparison encountered an older `catalog.json` from an edge cache. | Commit `5494ceb` added bounded retries while the deployment becomes consistent. |

Historical failed runs and their notifications remain visible after a later fix. Rerunning an old commit would repeat its old code. Check Source checks and Check and publish the website guide for the current main commit. The collection 2026.10.2 publication retains these existing fixes and runs the same source, size, bundle and live-deployment checks. No check is disabled to hide failures.
