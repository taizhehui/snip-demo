# Snip CLI

A zero-dependency Node CLI for the Snip URL shortener.

## Requirements

- Node 20+ (uses global `fetch`).

## Usage

    node cli.js add <url>     # shorten a URL, prints the short link
    node cli.js ls            # list all links (code, hits, url)
    node cli.js open <code>   # open a short code's target in your browser
    node cli.js help          # usage

Or use the wrappers (`snip`, `snip.cmd`, `snip.ps1`) which forward args to `cli.js`.

## Configuration

- `SNIP_API` — backend base URL (default `http://localhost:3000`).

Errors print to stderr and exit with code 1.
