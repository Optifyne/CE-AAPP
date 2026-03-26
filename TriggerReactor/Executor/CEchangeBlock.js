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
var Material = Java.type("org.bukkit.Material");
var Location = Java.type("org.bukkit.Location");
var UUID = Java.type("java.util.UUID");

function CEchangeBlock() {
    var ChangeBlockAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid actionLine format! CORRECT FORMAT: change_block: <action (damage or place)>;<world,x,y,z>;<block_material (in case of place) or damage_progress (in case of damage, from 0.0 to 1.0)>;(optional in case of place, mandatory in case of damage) <player (if you need to send a fake block changes, which will be simply visually only for a specific player, without changing the game world)>;(optional, only in case of damage) <entity_uuid (if you need to specify the source of the fake block damage)>");
                return;
            }
            
            switch (args[0]) {
                case "place":
                    var targetPlayer = Bukkit.getPlayer(args[3]);

                    var locParts = args[1].split(",");
                    if (locParts.length !== 4) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid location format! Expected format: world,x,y,z");
                        return;
                    }

                    var world = Bukkit.getWorld(locParts[0]);
                    if (world == null) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: World not found: " + locParts[0]);
                        return;
                    }

                    var x = parseFloat(locParts[1]);
                    var y = parseFloat(locParts[2]);
                    var z = parseFloat(locParts[3]);
                    var location = new Location(world, x, y, z);

                    var material = Material.matchMaterial(args[2].toUpperCase());
                    if (material == null) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid block material: " + args[2]);
                        return;
                    }

                    targetPlayer ? targetPlayer.sendBlockChange(location, material.createBlockData()) : location.getBlock().setType(material);
                    break;
                case "damage":
                    var targetPlayer = Bukkit.getPlayer(args[3]);
                    
                    if (targetPlayer == null) {
                    	Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Target player " + args[3] + " not found.");
                        return; 
                    }
                    
                    var sourceEntity = null;
                    try {
                    	sourceEntity = Bukkit.getEntity(UUID.fromString(args[4]));
                    } catch (e) {}

                    var locParts = args[1].split(",");
                    if (locParts.length !== 4) {
                    	Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid location format! Expected format: world,x,y,z");
                        return;
                    }

                    var world = Bukkit.getWorld(locParts[0]);
                    if (world == null) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: World not found: " + locParts[0]);
                        return;
                    }

                    var x = parseFloat(locParts[1]);
                    var y = parseFloat(locParts[2]);
                    var z = parseFloat(locParts[3]);
                    var location = new Location(world, x, y, z);
                    
                    if (isNaN(args[2])) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid damage progress.");
                        return;
                    }

                    var damage = parseFloat(args[2]);
                    if (damage < 0.0 || damage > 1.0) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid damage progress.");
                        return;
                    }

                    sourceEntity ? targetPlayer.sendBlockDamage(location, damage, sourceEntity) : targetPlayer.sendBlockDamage(location, damage);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_BLOCK ACTION: Invalid action! Use 'damage' or 'place'.");
                	return;
            }
        }
    });

    var changeBlockInstance = new ChangeBlockAction("change_block");
    
    return changeBlockInstance;
}

CEchangeBlock();