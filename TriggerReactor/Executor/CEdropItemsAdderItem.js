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
var Location = Java.type("org.bukkit.Location");
var itemsAdderPlugin = Bukkit.getPluginManager().getPlugin("ItemsAdder");

function CEdropItemsAdderItem() {
    if (!itemsAdderPlugin) {
        Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Action was skipped because ItemsAdder plugin is missing!");
        return null;
    } else {
        var itemsAdderStack = Java.type("dev.lone.itemsadder.api.CustomStack");
        var DropItemsAdderItemAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine) {
                var args = actionLine.split(";");
                if (args.length < 5) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid actionLine format! CORRECT FORMAT: drop_items_adder_item: <world>;<x>;<y>;<z>;<id (in format namespace:id, check https://itemsadder.devs.beer/turkish/plugin-usage/adding-content/basic-concepts/namespace for more info)>");
                    return;
                }

                var worldName = args[0].trim();
                var x = parseDouble(args[1].trim());
                var y = parseDouble(args[2].trim());
                var z = parseDouble(args[3].trim());
                var id = args[4].trim();
				
                var world = null;
                var location = null;
                try {
                    world = Bukkit.getWorld(worldName);
                    location = new Location(world, x, y, z);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid location.");
                }
                
                try {
                	var item = itemsAdderStack.getInstance(id);
                    item.drop(location);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] DROP_ITEMS_ADDER_ITEM ACTION: Invalid CustomStack id.");
                }
            }
        });

        var dropItemsAdderItemInstance = new DropItemsAdderItemAction("drop_items_adder_item");
        return dropItemsAdderItemInstance;
    }
}

CEdropItemsAdderItem();