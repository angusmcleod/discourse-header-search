# discourse-header-search
A Discourse plugin that makes the search bar visible in the header in the Desktop UI and hides the search menu icon.

- Only affects Desktop UI. Does not apply to mobile web.
- Is hidden when scrolling on a topic. See [Settings](##Settings).

![screenshot](https://cloud.githubusercontent.com/assets/5931623/11663508/b1d24796-9daa-11e5-8622-422d5bda3ccf.png)

## Installation

To install using docker, add the following to your app.yml in the plugins section:

```
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - mkdir -p plugins
          - git clone https://github.com/angusmcleod/discourse-header-search.git
```

and rebuild docker via

```
cd /var/discourse
./launcher rebuild app
```

## Settings

By default, the header search bar is hidden, and the normal search menu icon reappears, when you scroll down on a topic. 
This is to allow the topic title, category labels and tags to display (aka the 'extra info'). 

You can override the extra info and have the search input display instead by checking the setting ``override extra info`` in Settings > Plugins. 

## Known issues

The search UI suffers from the same issues as the current discourse search UI (as of 12/08/15), namely:

1. If you enter a search term, then delete it, the search results do not get updated, 
leaving you with an empty input and the results of your prior search term: http://quick.as/VjbYSqvAG

2. If you enter a search term, then delete it, then go to 'full page search', a single letter of your prior search
remains, on an otherwise blank page: http://quick.as/gLbJu98oX
