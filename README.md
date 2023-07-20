# Better Search Views

> **Warning**
>
> - The plugin is in early development, so it may be buggy
> - It relies on an internal API, so it may break after you update Obsidian
> - You need to reload Obsidian after enabling/disabling it
> 
> I encourage you to create issues if you noticed anything wrong: https://github.com/ivan-lednev/better-search-views/issues

## What it does

The plugin enhances native search views to create an outliner-like context around every match:
![image](https://github.com/ivan-lednev/better-search-views/assets/41428836/4da817f0-fb0e-4ab2-a0a9-0b8763d69fb8)

- **It patches native search, backlinks view, embedded backlinks and embedded queries**
- It renders markdown in the match to HTML
- It builds structural breadcrumbs to the match by chaining all the ancestor headings and list items above
- If the match is in a list item, it displays all the sub-list items below it
- If the match is in a heading, it displays the first section below the heading (you know, for context)

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
