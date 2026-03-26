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
var Location = Java.type("org.bukkit.Location");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var UUID = Java.type("java.util.UUID");
var ThreadLocalRandom = Java.type("java.util.concurrent.ThreadLocalRandom");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var protocolLibPlugin = Bukkit.getPluginManager().getPlugin("ProtocolLib");

function isPluginEnabled(pluginInstance) {
    try {
    	return pluginInstance != null && pluginInstance.isEnabled();
    } catch (e) {
        return false;
    }
}

function CEshowLightning() {
    if (!isPluginEnabled(protocolLibPlugin)) {
        Bukkit.getLogger().warning("[CEActions] SHOW_LIGHTNING ACTION: Action was skipped because ProtocolLib plugin is missing!");
        return;
    } else {
        var ProtocolLibrary = Java.type("com.comphenix.protocol.ProtocolLibrary");
        var PacketType = Java.type("com.comphenix.protocol.PacketType");
        
        var ShowLightningAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length != 5) {
                    Bukkit.getLogger().warning("[CEActions] SHOW_LIGHTNING ACTION: Invalid format! Correct format: show_lightning: <player>;<x>;<y>;<z>;<world>");
                    return;
                }
                
                var targetPlayer = args[0].trim();
                
                var target = null;
                try {
                    target = Bukkit.getPlayer(targetPlayer);
                } catch (e) {
                    target = player;
                }
                
                if (!target) {
                    Bukkit.getLogger().warning("[CEActions] SHOW_LIGHTNING ACTION: Target player not found!");
                    return;
                }
                
                var x = parseFloat(args[1]);
                var y = parseFloat(args[2]);
                var z = parseFloat(args[3]);
                var world = Bukkit.getWorld(args[4]);
                
                if (isNaN(x) || isNaN(y) || isNaN(z) || !world) {
                    Bukkit.getLogger().warning("[CEActions] SHOW_LIGHTNING ACTION: Location is incorrect!");
                    return;
                }
                
                var loc = new Location(world, x, y, z);
                
                var pm = ProtocolLibrary.getProtocolManager();

                var entityId = ThreadLocalRandom.current().nextInt(1, 2147483647);
                var uuid = UUID.randomUUID();

                var spawn = pm.createPacket(PacketType.Play.Server.SPAWN_ENTITY);
                
                var entity;
                try {
                    entity = EntityType.valueOf("LIGHTNING_BOLT");
                } catch (e) {
                    entity = EntityType.valueOf("LIGHTNING");
                }

                spawn.getIntegers().write(0, entityId);
                spawn.getUUIDs().write(0, uuid);
                spawn.getEntityTypeModifier().write(0, entity);

                spawn.getDoubles().write(0, loc.getX());
                spawn.getDoubles().write(1, loc.getY());
                spawn.getDoubles().write(2, loc.getZ());
                
                pm.sendServerPacket(target, spawn);
            }
        });
    }

    var showLightningInstance = new ShowLightningAction("show_lightning");
    
    return showLightningInstance;
}

CEshowLightning();