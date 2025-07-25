**❗ Join originally [ConditionalEvents Discord](https://discord.com/channels/698332177137401987/1348313697436569733) to the origin of this addon ❗**

**👋 Hello, this addon adds a big pack of new actions and placeholders to ConditionalEvents, with it you have full control over entities, players, storages and many other useful features: everything that was previously possible only through vanilla commands or not possible at all in ConditionalEvents, is now possible directly in the built-in actions or placeholders.**

### The main goal of the addon is to provide as much functionality as possible in addition to the existing one, quality tries not to be inferior to quantity.

## ⚙️ Installation:
1. Install the TriggerReactor plugin [here](https://github.com/TriggerReactor/TriggerReactor/releases/download/3.5.0.6-Beta/TriggerReactor-bukkit-latest-3.5.0.6-Beta.jar).
2. Install the TriggerReactor dependency [here](https://www.spigotmc.org/resources/jshader.93342/download?version=406835).
3. **Download the the newest version [here](https://akcel.fun/ce-aapp) OR download all source content here on GitHub.**
4. Unpack the contents of the archive into the plugins folder (as a result, the plugins folder should contain the TriggerReactor folder with all its contents, and if the folder was already there, replace it).
5. Restart the server
6. Make sure that everything is installed without errors: in the console you should see messages from ConditionalEvents and PlaceholderAPI about successful registration of new actions and new extension respectively.

## 🔧 Modification:
For advanced users there is a great opportunity to modify everything instantly and easily: all data is stored in the path ``plugins/TriggerReactor/Executor``, ``CEPlaceholdersActivator`` activates the registration of placeholders and ``CEActionsActivator`` activates the registration of actions, all placeholders are in the same file and all actions are in different files which are named accordingly. If you want to replace something in an action or placeholder, just change the necessary files in the desired location and reload the server. Adding new actions and placeholders is also quite simple: for a new action, just create a new file in this folder and name it so that it starts with ``CE``, does not contain ``Activator`` and has the extension ``.js``; in case of new placeholders, add them in the file ``CEPlaceholdersActivator``, and after all the changes, also restart the server.

## 📌 Information ([CE AAPP DOCS](https://optifynes-organization.gitbook.io/ce-aapp/)):
### For now the addon has 47 new actions and 16 new placeholders with different subplaceholders.

**Using this pack, you can easily and quickly do the following**:

➡️ **With actions**: ``add, remove and change items from entities, players and storages, change weather and time (including for an individual player), give velocity to entities and players, change health and artificial intelligence of entities and players, change terrain like in WorldEdit, set entities and players on fire and freeze them, change player stats and balance, deal damage to entities and players (including source), forcibly drop the current item from the player's hands, parse the placeholder without any output, create new crafts, launch projectiles, create explosions, change gravity, place/break ItemsAdder/Oraxen blocks, change air level and many more.``

➡️ **With placeholders**: ``get item information from entities, players and storages, check for LuckPerms permissions with contexts, get highest block on location, get biomes on location, get random block in radius, get entities in radius, check if an entity is in water, process arrays, get real nickname by custom nickname in Essentials, get information about /team commands, get entity health, location, name, type, air level, frozeness, burnness etc information by UUID, save and obtain custom data (custom variables), get entity’s passengers, get player's open inventory and many more.``


**⚠️ Please report any problems or bugs you find, and suggest ideas for new features (to "issues" here or direct messages on Spigot or Discord).**
