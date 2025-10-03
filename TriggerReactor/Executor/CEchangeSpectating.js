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
var protocolLibPlugin = Bukkit.getPluginManager().getPlugin("ProtocolLib");

function CEchangeSpectating() {
    if (!protocolLibPlugin) {
        Bukkit.getLogger().warning("[CEActions] CHANGE_SPECTATING ACTION: Action was skipped because ProtocolLib plugin is missing!");
        return;
    } else {
        var ProtocolLibrary = Java.type("com.comphenix.protocol.ProtocolLibrary");
        var protocolManager = ProtocolLibrary.getProtocolManager();
        var PacketContainer = Java.type("com.comphenix.protocol.events.PacketContainer");
        var PacketType = Java.type("com.comphenix.protocol.PacketType");

        var ChangeSpectatingAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length != 2) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPECTATING ACTION: Invalid format! Correct format: change_spectating: <player>;<entity_uuid|player_name>");
                    return;
                }
                
                var sourcePlayer = args[0].trim();
                
                var source = null;
                try {
                    source = Bukkit.getPlayer(sourcePlayer);
                } catch (e) {
                    source = player;
                }
                
                if (!source) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPECTATING ACTION: Source player not found!");
                    return;
                }

                var targetEntity = args[1].trim();
                
                var target = null;
                try {
                    target = Bukkit.getEntity(UUID.fromString(targetEntity));
                } catch (e) {
                    target = Bukkit.getPlayer(targetEntity);
                }
                
                if (!target) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPECTATING ACTION: Target entity or player not found!");
                    return;
                }

                var cameraPacket = new PacketContainer(PacketType.Play.Server.CAMERA);
                cameraPacket.getIntegers().write(0, target.getEntityId());
                
                protocolManager.sendServerPacket(source, cameraPacket);
            }
        });

        var changeSpectatingInstance = new ChangeSpectatingAction("change_spectating");
        
        return changeSpectatingInstance;
    }
}

CEchangeSpectating();