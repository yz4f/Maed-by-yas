# Troubleshooting media assets

This directory keeps the original media used by the in-site troubleshooting library as a GitHub backup. The production user interface loads delivery copies from the configured CDN, which keeps the website bundle lightweight while preserving the original source files here.

| Library guide | Screenshot backup | Video backup | Production behavior |
|---|---|---|---|
| Network or Wi-Fi connection error | `network-error.png` | `network-error-solution.mp4` | Displays the screenshot, plays the dedicated solution video inside the guide library, and provides the Cloudflare WARP Windows download link. |
| System time and verification error | `system-time-error.png` | `system-time-error-solution.mp4` | Displays the screenshot and plays the dedicated solution video inside the guide library. |

The files are retained as source backups. Do not replace the production CDN references with local paths unless the site media-delivery strategy is changed deliberately.
