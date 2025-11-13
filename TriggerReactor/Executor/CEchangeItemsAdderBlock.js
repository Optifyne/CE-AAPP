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
        return;
    } else {
        var itemsAdderBlock = Java.type("dev.lone.itemsadder.api.CustomBlock");
        var ChangeItemsAdderBlockAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length < 2 || (args[0] === "SET" && args.length < 3)) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid actionLine format! CORRECT FORMAT: change_items_adder_block: <mode (may be SET or REMOVE)>;<world,x,y,z>;(only in case of SET) <block_id (in format namespace:id, check https://itemsadder.devs.beer/plugin-usage/beginners/configs-and-resourcepack#what-is-a-namespace for more info)>");
                    return;
                }
                
                var mode = args[0].trim().toUpperCase();
                var locParts = args[1].split(",");
                var id = args[2];
                
                if (locParts.length !== 4) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid location.");
                    return;
                }

                var worldName = locParts[0].trim();
                var x = parseFloat(locParts[1].trim());
                var y = parseFloat(locParts[2].trim());
                var z = parseFloat(locParts[3].trim());
				
                var world = null;
                var location = null;
                try {
                    world = Bukkit.getWorld(worldName);
                    location = new Location(world, x, y, z);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid location.");
                    return;
                }
                
                if (!location) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid location.");
                    return;
                }
                
                switch (mode) {
                    case "SET":
                        try {
                            var block = itemsAdderBlock.getInstance(id);
                            if (!block) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid CustomBlock id.");
                                return;
                            }
                            
                            block.place(location);
                            break;
                        } catch (e) {
                    		Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Invalid CustomBlock id.");
                            return;
                		}
                    case "REMOVE":
                        try {
                            itemsAdderBlock.remove(location);
                            break;
                        } catch (e) {
                    		Bukkit.getLogger().warning("[CEActions] CHANGE_ITEMS_ADDER_BLOCK ACTION: Removing failed (perhaps it is not ItemsAdder block?).");
                            return;
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