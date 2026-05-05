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
var UUID = Java.type("java.util.UUID");
var System = Java.type("java.lang.System");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var protocolLibPlugin = Bukkit.getPluginManager().getPlugin("ProtocolLib");

var systemProperties = System.getProperties();

var disabledPlayers = new java.util.HashSet();
var damageEventListener = null;

function isPluginEnabled(pluginInstance) {
    try {
    	return pluginInstance != null && pluginInstance.isEnabled();
    } catch (e) {
        return false;
    }
}

function CEmanageHurtSound() {
    if (!isPluginEnabled(protocolLibPlugin)) {
        Bukkit.getLogger().warning("[CEActions] MANAGE_HURT_SOUND ACTION: Action was skipped because ProtocolLib plugin is missing!");
        return;
    } else {
        var ProtocolLibrary = Java.type("com.comphenix.protocol.ProtocolLibrary");
        var PacketType = Java.type("com.comphenix.protocol.PacketType");
        var PacketAdapter = Java.type("com.comphenix.protocol.events.PacketAdapter");
        var ListenerPriority = Java.type("com.comphenix.protocol.events.ListenerPriority");

        var protocolManager = ProtocolLibrary.getProtocolManager();
        
        function createListener() {
            damageEventListener = new (Java.extend(PacketAdapter))(
                protocolLibPlugin,
                ListenerPriority.NORMAL,
                [PacketType.Play.Server.DAMAGE_EVENT]
            ) {
                onPacketSending: function(event) {
                    try {
                        var packet = event.getPacket();
                        var ints = packet.getIntegers();
                        if (ints.size() === 0) return;

                        var victimId = ints.read(0);
                        var receiver = event.getPlayer();
                        
                        if (receiver === null) return;
                        
                        var receiverId = receiver.getUniqueId();

                        if (disabledPlayers.contains(receiverId) && victimId === receiver.getEntityId()) {
                            event.setCancelled(true);
                        }
                    } catch (e) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_HURT_SOUND ACTION: Error in DAMAGE_EVENT listener: " + e);
                    }
                }
            };

            protocolManager.addPacketListener(damageEventListener);
            systemProperties.put("CEmanageHurtSoundListener", damageEventListener);
    	}
        
        var ManageHurtSoundAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length < 2) {
                    Bukkit.getLogger().warning("[CEActions] MANAGE_HURT_SOUND ACTION: Invalid format! Correct format: manage_hurt_sound: <player>;<action (disable|enable)>");
                    return;
                }
                
                var targetPlayer = args[0].trim();
                var disable = args[1].trim().toLowerCase() === "disable";
                
                var target = Bukkit.getPlayer(targetPlayer);
                if (!target) {
                    try {
                        target = Bukkit.getOfflinePlayer(UUID.fromString(targetPlayer));
                    } catch (e) {
                        target = Bukkit.getOfflinePlayer(targetPlayer);
                    }
                }
                
                if (!target.isOnline() && !target.hasPlayedBefore()) target = null;
                
                if (!target) {
                    Bukkit.getLogger().warning("[CEActions] MANAGE_HURT_SOUND ACTION: Target player not found!");
                    return;
                }
                
                var uuid = target.getUniqueId();
                disable ? disabledPlayers.add(uuid) : disabledPlayers.remove(uuid);
                
                if (disable && damageEventListener == null) createListener();
                else if (damageEventListener != null && disabledPlayers.isEmpty()) {
                    protocolManager.removePacketListener(damageEventListener);
                    damageEventListener = null;
            		systemProperties.remove("CEmanageHurtSoundListener");
                }
            }
        });
    }

    var manageHurtSoundInstance = new ManageHurtSoundAction("manage_hurt_sound");
    
    return manageHurtSoundInstance;
}

CEmanageHurtSound();