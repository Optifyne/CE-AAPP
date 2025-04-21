/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var Location = Java.type("org.bukkit.Location");
var itemsAdderPlugin = Bukkit.getPluginManager().getPlugin("ItemsAdder");

function CEchangeItemsAdderBlock() {
    if (!itemsAdderPlugin) {
        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Action was skipped because ItemsAdder plugin is missing!");
        return null;
    } else {
        var itemsAdderBlock = Java.type("dev.lone.itemsadder.api.CustomBlock");
        var ChangeItemsAdderBlockAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine) {
                var args = actionLine.split(";");
                if (args.length < 5) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid actionLine format! CORRECT FORMAT: change_items_adder_block: <mode (may be SET or REMOVE)>;<world>;<x>;<y>;<z>;<id (in format namespace:id, check https://itemsadder.devs.beer/turkish/plugin-usage/adding-content/basic-concepts/namespace for more info, id is not necessary when REMOVE mode is selected)>");
                    return;
                }

                var mode = args[0].trim().toUpperCase();
                var worldName = args[1].trim();
                var x = parseFloat(args[2].trim());
                var y = parseFloat(args[3].trim());
                var z = parseFloat(args[4].trim());
                var id = args[5] ? args[5].trim() : null;
				
                var world = null;
                var location = null;
                try {
                    world = Bukkit.getWorld(worldName);
                    location = new Location(world, x, y, z);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid location.");
                }
                
                switch (mode) {
                    case "SET":
                        try {
                            var block = itemsAdderBlock.getInstance(id);
                            block.place(location);
                            break;
                        } catch (e) {
                    		Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid CustomBlock id.");
                		}
                    case "REMOVE":
                        try {
                            itemsAdderBlock.remove(location);
                            break;
                        } catch (e) {
                    		Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Removing failed (perhaps it is not ItemsAdder block?).");
                		}
                    default:
                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid mode, use SET or REMOVE.");
                        return;
                }
            }
        });

        var changeItemsAdderBlockInstance = new ChangeItemsAdderBlockAction("change_items_adder_block");
        
        return changeItemsAdderBlockInstance;
    }
}

CEchangeItemsAdderBlock();