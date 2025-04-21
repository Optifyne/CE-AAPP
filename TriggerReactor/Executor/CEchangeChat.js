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
var ComponentSerializer = Java.type("net.md_5.bungee.chat.ComponentSerializer");
var ChatColor = null;
var Component = null;
var MiniMessage = null;

var isSuitableCore = false;
var supportsMiniMessage = false;
var supportsBungeeAPI = false;

try {
    var version = Bukkit.getVersion();
    isSuitableCore = !version.contains("Spigot") && !version.contains("Bukkit");
    if (isSuitableCore) {
        var paperVersion = Bukkit.getMinecraftVersion().split(".");
        var major = parseInt(paperVersion[0]);
        var minor = parseInt(paperVersion[1]);
        var patch = parseInt(paperVersion[2] || 0);

        if (major > 1 || (major === 1 && minor > 19) || (major === 1 && minor === 19 && patch >= 4)) {
            MiniMessage = Java.type("net.kyori.adventure.text.minimessage.MiniMessage");
            Component = Java.type("net.kyori.adventure.text.Component");
            supportsMiniMessage = true;
        }

        if (major === 1 && minor >= 16) {
            ChatColor = Java.type("net.md_5.bungee.api.ChatColor");
            supportsBungeeAPI = true;
        }
    }
} catch (e) {
    isSuitableCore = false;
    supportsMiniMessage = false;
    supportsBungeeAPI = false;
}

function CEchangeChat() {
    var ChangeChatAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";", 2);
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_CHAT ACTION: Invalid format! CORRECT FORMAT: change_chat: <player>;<SET|CLEAR>;(in case of SET) <message (may be JSON, MiniMessage or just String)>");
                return;
            }

            var targetIdentifier = args[0];
            var action = args[1].toUpperCase();
            var message = actionLine.substring(actionLine.indexOf(action) + action.length + 1);

            var targetPlayer = Bukkit.getPlayer(targetIdentifier);

            if (targetPlayer == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_CHAT ACTION: Target player not found: " + targetIdentifier);
                return;
            }
            
            function clearChat(tPlayer) {
                for (var i = 0; i < 100; i++) {
                    tPlayer.sendMessage("");
                }
            }

            switch (action) {
                case "CLEAR":
                    clearChat(targetPlayer);
                    break;
                case "SET":
                    if (message.startsWith("{") && message.endsWith("}")) {
                        try {
                            var baseComponents = ComponentSerializer.parse(message);
                            clearChat(targetPlayer);
                            targetPlayer.spigot().sendMessage(baseComponents);
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_CHAT ACTION: Invalid JSON format!");
                        }
                    } else if (message.startsWith("<") && message.endsWith(">")) {
                        if (supportsMiniMessage) {
                            var miniMessage = MiniMessage.miniMessage();
                            var miniComponent = miniMessage.deserialize(message);
                            clearChat(targetPlayer);
                            targetPlayer.sendMessage(miniComponent);
                        } else {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_CHAT ACTION: MiniMessage is only available on Paper 1.19.4+. You have " + Bukkit.getVersion());
                        }
                    } else {
                        var coloredMessage = message.replace(/&([0-9a-fk-or])/g, "§$1");
                        
                        if (supportsBungeeAPI) {
                            coloredMessage = coloredMessage.replace(/#([A-Fa-f0-9]{6})/g, function(match, hex) {
                                return ChatColor.of("#" + hex);
                            });
                        } else {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_CHAT ACTION: HEX color codes are only available on Paper 1.16+. You have " + Bukkit.getVersion());
                        }

                        coloredMessage = coloredMessage.replace(/\\n/g, "\n");

                        clearChat(targetPlayer);
                        targetPlayer.sendMessage(coloredMessage);
                    }
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_CHAT ACTION: Invalid action: " + action + ". Use 'SET' or 'CLEAR'.");
            }
        }
    });

    var changeChatInstance = new ChangeChatAction("change_chat");

    return changeChatInstance;
}

CEchangeChat();