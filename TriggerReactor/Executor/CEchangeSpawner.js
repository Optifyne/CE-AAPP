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
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
 *     GNU General Public License for more details.  
 *  
 *     You should have received a copy of the GNU General Public License  
 *     along with this program. If not, see <http://www.gnu.org/licenses/>.  
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
try {
	var BaseSpawner = Java.type("org.bukkit.spawner.BaseSpawner");
	var Spawner = Java.type("org.bukkit.spawner.Spawner");
} catch (e) {}
var CreatureSpawner = Java.type("org.bukkit.block.CreatureSpawner");
var Location = Java.type("org.bukkit.Location");
var EntityType = Java.type("org.bukkit.entity.EntityType");

function CEchangeSpawner() {
    var ChangeSpawnerAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid format! Correct format: change_spawner: <option>;<value>;<world,x,y,z>");
                return;
            }

            var option = args[0].trim();
            var blockLoc = args[2].trim().split(",");
            
            if (blockLoc.length < 4) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid location.");
                return;
            }
            
            var world = Bukkit.getWorld(blockLoc[0]);
            var x = parseFloat(blockLoc[1]);
			var y = parseFloat(blockLoc[2]);
			var z = parseFloat(blockLoc[3]);
                            
            var block = world.getBlockAt(x, y, z);
            var blockState = block.getState();
            
            switch (option) {
                case "spawnerType":
                    if ((BaseSpawner && blockState instanceof BaseSpawner) || (blockState instanceof CreatureSpawner)) {
                        try {
                        	var value = EntityType.valueOf(args[1]);
                        } catch (e) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerType."); return; }
                        
                        blockState.setSpawnedType(value);
                        blockState.update();
                        return;
                    } else { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (BaseSpawner ? "BaseSpawner." : "CreatureSpawner.")); return; }
                case "spawnerDelay":
                    if ((BaseSpawner && blockState instanceof BaseSpawner) || (blockState instanceof CreatureSpawner)) {
                        var valDelay = parseInt(args[1]);
                        if (isNaN(valDelay)) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerDelay."); return; }
                        blockState.setDelay(valDelay);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (BaseSpawner ? "BaseSpawner." : "CreatureSpawner."));
                    return;
                case "spawnerRequiredPlayerRange":
                case "spawnerReqPlRng":
                    if ((BaseSpawner && blockState instanceof BaseSpawner) || (blockState instanceof CreatureSpawner)) {
                        var valRng = parseInt(args[1]);
                        if (isNaN(valRng)) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerRequiredPlayerRange."); return; }
                        blockState.setRequiredPlayerRange(valRng);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (BaseSpawner ? "BaseSpawner." : "CreatureSpawner."));
                    return;
                case "spawnerSpawnRange":
                case "spawnerSpRng":
                    if ((BaseSpawner && blockState instanceof BaseSpawner) || (blockState instanceof CreatureSpawner)) {
                        var valSpRng = parseInt(args[1]);
                        if (isNaN(valSpRng)) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerSpawnRange."); return; }
                        blockState.setSpawnRange(valSpRng);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (BaseSpawner ? "BaseSpawner." : "CreatureSpawner."));
                    return;
                case "spawnerMaxNearbyEntities":
                case "spawnerMaxNEnt":
                    if ((Spawner && blockState instanceof Spawner) || (blockState instanceof CreatureSpawner)) {
                        var valMaxNE = parseInt(args[1]);
                        if (isNaN(valMaxNE)) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerMaxNearbyEntities."); return; }
                        blockState.setMaxNearbyEntities(valMaxNE);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (Spawner ? "Spawner." : "CreatureSpawner."));
                    return;
                case "spawnerMaxSpawnDelay":
                case "spawnerMaxSpDel":
                    if ((Spawner && blockState instanceof Spawner) || (blockState instanceof CreatureSpawner)) {
                        var valMaxDel = parseInt(args[1]);
                        if (isNaN(valMaxDel) || valMaxDel < 0 || valMaxDel < blockState.getMinSpawnDelay()) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerMaxSpawnDelay."); return; }
                        blockState.setMaxSpawnDelay(valMaxDel);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (Spawner ? "Spawner." : "CreatureSpawner."));
                    return;
                case "spawnerMinSpawnDelay":
                case "spawnerMinSpDel":
                    if ((Spawner && blockState instanceof Spawner) || (blockState instanceof CreatureSpawner)) {
                        var valMinDel = parseInt(args[1]);
                        if (isNaN(valMinDel)) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerMinSpawnDelay."); return; }
                        blockState.setMinSpawnDelay(valMinDel);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (Spawner ? "Spawner." : "CreatureSpawner."));
                    return;
                case "spawnerSpawnCount":
                case "spawnerSpCount":
                    if ((Spawner && blockState instanceof Spawner) || (blockState instanceof CreatureSpawner)) {
                        var valCount = parseInt(args[1]);
                        if (isNaN(valCount)) { Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid value for spawnerSpawnCount."); return; }
                        blockState.setSpawnCount(valCount);
                        blockState.update();
                        return;
                    }
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Block is not " + (Spawner ? "Spawner." : "CreatureSpawner."));
                    return;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPAWNER ACTION: Invalid option.");
                	return;
            }
        }
    });

    var changeSpawnerInstance = new ChangeSpawnerAction("change_spawner");
    
    return changeSpawnerInstance;
}

CEchangeSpawner();