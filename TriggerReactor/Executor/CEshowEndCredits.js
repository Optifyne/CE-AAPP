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

function CEshowEndCredits() {
    if (!protocolLibPlugin) {
        Bukkit.getLogger().warning("[CEActions] SHOW_END_CREDITS ACTION: Action was skipped because ProtocolLib plugin is missing!");
        return;
    } else {
        var ProtocolLibrary = Java.type("com.comphenix.protocol.ProtocolLibrary");
		var protocolManager = ProtocolLibrary.getProtocolManager();
        var PacketContainer = Java.type("com.comphenix.protocol.events.PacketContainer");
        var PacketType = Java.type("com.comphenix.protocol.PacketType");
        var ShowEndCreditsAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length != 1) {
                    Bukkit.getLogger().warning("[CEActions] SHOW_END_CREDITS ACTION: Invalid format! Correct format: show_end_credits: <player>");
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
                    Bukkit.getLogger().warning("[CEActions] SHOW_END_CREDITS ACTION: Target player not found!");
                    return;
                }

                var endCredits = new PacketContainer(PacketType.Play.Server.GAME_STATE_CHANGE);
                                
                endCredits.getModifier().writeDefaults();
                endCredits.getGameStateIDs().write(0, 4);
                endCredits.getFloat().write(0, java.lang.Float.valueOf(1.0));

                protocolManager.sendServerPacket(target, endCredits);
            }
        });

        var showEndCreditsInstance = new ShowEndCreditsAction("show_end_credits");

        return showEndCreditsInstance;
    }
}

CEshowEndCredits();