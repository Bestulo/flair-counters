# flair-stats
Node.js tool to count how many people per flair post on a subreddit and their upvote/downvote ratios

## How to set up:

Go to index.js, line 14, and change the settings as you please.

Open your console, `cd` into the folder's directory and use the following commands:

`npm install`

Wait for everything to be installed, NPM will tell you.

`node .`

It will run, and the console should show you what page is being parsed and added to the total.

In the end, the program will overwrite the file called flairCounters.json, where you will have your latest results. If you want to save a set of results, make sure to change its name so that running the program won't overwrite it.
