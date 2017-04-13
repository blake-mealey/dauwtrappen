# uofc-scraper

University of Calgary Course scraper. Uses selenium to scrape the public course search of UofC.

Current Issues: 
-Slow, like, it's just slow to crawl the site. Look into selenium's grid configuration.

-Mistakes in time: Depending how classes entered the time, and when, some are 24hour format, some arn't. Furthermore some have duplicate entries,  The current commit:  fb5fcc4 is based off the older format, which is 12hour.

-Duplicate entries: Due to how UofC's webpage is configured, it seems to randomly have duplicate entries. might have newlines, but in anycase, currently doesn't handle it.

-No idea how to get it out of intellij.

-Doesn't save the schedules, doesn't parse all possible data. 


Haaave fun!
