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
var Location = Java.type("org.bukkit.Location");
var UUID = Java.type("java.util.UUID");

function CEcreateExplosion() {
    var CreateExplosionAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if ((args[4] === "TNT" && args.length < 7) || (args[4] === "EXPLOSION" && args.length < 8)) {
                Bukkit.getLogger().warning("[CEActions] CREATE_EXPLOSION ACTION: Invalid format! Correct format: create_explosion: <world>;<x>;<y>;<z>;<type (may be TNT or EXPLOSION)>;<power>;(only in case of TNT) <delay_in_ticks>;(only in case of EXPLOSION) <set_fire (true|false)>;(only in case of EXPLOSION) <break_blocks (true|false)>;(optional, only in case of EXPLOSION) <source_entity (entity_uuid|player_name)>");
                return;
            }

            var worldName = args[0].trim();
            var x = parseFloat(args[1].trim());
            var y = parseFloat(args[2].trim());
            var z = parseFloat(args[3].trim());
            var type = args[4].trim().toUpperCase();
            var world = Bukkit.getWorld(worldName);

            if (!world) {
                Bukkit.getLogger().warning("[CEActions] CREATE_EXPLOSION ACTION: Invalid world " + worldName);
                return;
            }
            
            var location = new Location(world, x, y, z);
			
            switch (type) {
                case "TNT":
                    var power = parseFloat(args[5].trim()).floatValue();
                    var delay = parseInt(args[6].trim());
                    var tnt = world.spawnEntity(location, EntityType.PRIMED_TNT);
                    tnt.setFuseTicks(delay);
                    tnt.setYield(power);
                	break;
                case "EXPLOSION":
                    var power = parseFloat(args[5].trim()).floatValue();
                    var setFire = args[6].trim().toLowerCase() === "true";
                    var breakBlocks = args[7].trim().toLowerCase() === "true";
                    var source = args.length > 8 ? args[8].trim() : null;
                    
                    var sourceEntity = null;
                    if (source) {
                        try {
                            sourceEntity = Bukkit.getEntity(UUID.fromString(source));
                        } catch (e) {
                            sourceEntity = Bukkit.getPlayer(source);
                        }
                    }
                    
                    if (source && !sourceEntity) {
                        Bukkit.getLogger().warning("[CEActions] CREATE_EXPLOSION ACTION: The indicated explosion source was not found");
                        return;
                    }

                    sourceEntity ? world.createExplosion(location, power, setFire, breakBlocks, sourceEntity) : world.createExplosion(location, power, setFire, breakBlocks);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CREATE_EXPLOSION: Invalid type " + type);
            }
        }
    });

    var createExplosionInstance = new CreateExplosionAction("create_explosion");
    return createExplosionInstance;
}

CEcreateExplosion();