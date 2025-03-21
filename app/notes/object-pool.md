I recently removed the majority of aync database requests in the frontend for vfdir. The primary motivation for this was to reduce rerenders caused by coarse reactive queries. Maintaining this system meant first calculating the approriate time to rerun a query against the database when data changed. And then after receiveing data sending the update to a svelte store. 

A naive version of the first meant that updating a single image source in a single row, would cause any query relying on the Blocks table to rerun. Yes, running `update blocks set image='abc' where id=1` will rerun `select name from blocks where id=24 limit 1`. Not optimizing the second part with a deep merge means `update blocks set image='abc' where id=1` also will destroy and rerender my entire list of 200 blocks `where channel_id='whatever'`, the nested metadata in a query to calculate it's length, and joins on each block to get it's author's data, connector's data, and related channels. Summary: Inefficient AF. 

After moving to event sourcing, doing some reading on CQRS, Toumas Artman's first Linear Sync Talk, and Evan Wallace's Figma multiplayer article I decided to try something a little different. It's not glamorous or new, it's just a couple of maps with objects inside. I'd tried a much worse version of this before getting sql-pilled by Riffle, but hadn't made the "breakthrough" to connect them together with getters.

This is a lot of yapping already. Let's compare building the same UI with each approach and see how they compare:

Goal: get all blocks within a channel. render as a table with metadata. Each entry should have a preview display. For channels, that will be a preview of the first few blocks inside.

Goal: get block given it's id. Display the contents. Add a list of its connections as part of metadata. Connections are all channels the block is in, along with other blocks with the same media, or links from a shared url.

