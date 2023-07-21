# Better Search Views

> **Warning**
>
> - You need to reload Obsidian after you **install/update/enable/disable** the plugin
> - The plugin reaches into Obsidian's internals, so it may break after an update. If you noticed that, [please create an issue](https://github.com/ivan-lednev/better-search-views/issues)

## Installation

Until the plugin added to the community plugin list, you can try it out via [BRAT](https://github.com/TfTHacker/obsidian42-brat), the download code is `ivan-lednev/better-search-views`

## What it does

The plugin brings more outliner goodness into Obsidian: it improves search views to create an outliner-like context around every match.
- **It patches native search, backlinks view, embedded backlinks and embedded queries**
- It renders markdown in the match to HTML
- It builds structural breadcrumbs to the match by chaining all the ancestor headings and list items above
- If the match is in a list item, it displays all the sub-list items below it
- If the match is in a heading, it displays the first section below the heading (you know, for context)

### Global search looks like this

![image](https://github.com/ivan-lednev/better-search-views/assets/41428836/94ee1165-4ee3-4af9-8031-fb4b7f13588c)

### And here's backlinks in document

![image](https://github.com/ivan-lednev/better-search-views/assets/41428836/2f5229bc-8d3d-4027-b01c-fa36d5872716)

### Embedded queries

![image](https://github.com/ivan-lednev/better-search-views/assets/41428836/bdf7fb5d-dcc2-4067-9abb-9c2064c09a27)

### Clicking on breadcrumbs works just as you might expect

![image](./src/click-demo.gif)

### Hovering over any elemetn with the control key pressed triggers a pop-up

![image](./src/hover-demo.gif)

## How to use it

Just install it and reload Obsidian.

## Contribution

If you noticed a bug or have an improvement idea, [please create an issue](https://github.com/ivan-lednev/better-search-views/issues).

Pull-requests are welcome! If you want to contribute but don't know where to start, you can create an issue or write me an email: <bishop1860@gmail.com>.

You can also support the development directly:

<a href="https://www.buymeacoffee.com/machineelf" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

# Acknowledgements

- Thanks to [TFTHacker](https://tfthacker.com/) for [his plugin](https://github.com/TfTHacker/obsidian42-strange-new-worlds), which helped me figure out how to implement a bunch of small improvements
- Thanks to [NothingIsLost](https://github.com/nothingislost) for his awesome plugins, that helped me figure out how to patch Obsidian internals
- Thanks to [PJEby](https://github.com/pjeby) for his [patching library](https://github.com/pjeby/monkey-around)
