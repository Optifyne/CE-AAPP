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

function CEchangeTime() {
    var ChangeTimeAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2 || args.length > 5) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TIME ACTION: Invalid actionLine format! CORRECT FORMAT: change_time: <world>;<time (may be DAY, NIGHT, MIDDAY, MIDNIGHT or number from 0 to 24000)>;<player (if you need to set the time only for the specified player)>;(optional) sync (if you need to synchronize the player's time with the server);(optional) relative (if need the player's time to move and not stand still)");
                return;
            }

            var worldName = args[0];
            var timeType = args[1].toUpperCase();
            var playerName = args.length >= 3 ? args[2] : null;

            var sync = false;
            var relative = false;

            for (var i = 3; i < args.length; i++) {
                var param = args[i].toLowerCase();
                if (param === "sync") {
                    sync = true;
                } else if (param === "relative") {
                    relative = true;
                }
            }

            var world = Bukkit.getWorld(worldName);
            if (world == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TIME ACTION: World '" + worldName + "' not found!");
                return;
            }

            var time;
            switch (timeType) {
                case "DAY":
                    time = 1000;
                    break;
                case "NIGHT":
                    time = 13000;
                    break;
                case "MIDDAY":
                    time = 6000;
                    break;
                case "MIDNIGHT":
                    time = 18000;
                    break;
                default:
                    time = parseInt(timeType);
                    if (isNaN(time) || time < 0 || time > 24000) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_TIME ACTION: Invalid time value: " + timeType);
                        return;
                    }
                    break;
            }

            if (playerName) {
                var targetPlayer = Bukkit.getPlayer(playerName);
                if (targetPlayer == null) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_TIME ACTION: Player '" + playerName + "' not found!");
                    return;
                }

                if (sync) {
                    targetPlayer.setPlayerTime(targetPlayer.getWorld().getTime(), relative);
                } else {
                    targetPlayer.setPlayerTime(time, relative);
                }
            } else {
                world.setTime(time);
            }
        }
    });

    var changeTimeInstance = new ChangeTimeAction("change_time");

    return changeTimeInstance;
}

CEchangeTime();