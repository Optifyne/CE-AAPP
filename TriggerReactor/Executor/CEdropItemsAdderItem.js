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

function CEdropItemsAdderItem() {
    if (!itemsAdderPlugin) {
        Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Action was skipped because ItemsAdder plugin is missing!");
        return;
    } else {
        var itemsAdderStack = Java.type("dev.lone.itemsadder.api.CustomStack");
        var DropItemsAdderItemAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length < 2) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid actionLine format! CORRECT FORMAT: drop_items_adder_item: <world,x,y,z>;<item_id (in format namespace:id, check https://itemsadder.devs.beer/plugin-usage/beginners/configs-and-resourcepack#what-is-a-namespace for more info)>");
                    return;
                }
                
                var locParts = args[0].split(",");
                var id = args[1].trim();
                
                if (locParts.length !== 4) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid location.");
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
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid location.");
                    return;
                }
                
                if (!location) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid location.");
                    return;
                }
                
                try {
                	var item = itemsAdderStack.getInstance(id);
                    if (!item) {
                        Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid CustomStack id.");
                    	return;
                    }
                    
                    item.drop(location);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid CustomStack id.");
                    return;
                }
            }
        });

        var dropItemsAdderItemInstance = new DropItemsAdderItemAction("drop_items_adder_item");
        
        return dropItemsAdderItemInstance;
    }
}

CEdropItemsAdderItem();