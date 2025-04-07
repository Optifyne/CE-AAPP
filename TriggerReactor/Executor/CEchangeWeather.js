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

function CEchangeWeather() {
    var ChangeWeatherAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2 || args.length > 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_WEATHER ACTION: Invalid actionLine format! CORRECT FORMAT: change_weather: <world>;<weather_type (may be SUN, STORM or THUNDER)>;(optional) <duration (in seconds)>");
                return;
            }

            var worldName = args[0];
            var weatherType = args[1].toUpperCase();
            var duration = args.length == 3 ? parseInt(args[2]) : null;

            if (isNaN(duration) && duration !== null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_WEATHER ACTION: Invalid duration value!");
                return;
            }

            var world = Bukkit.getWorld(worldName);
            if (world == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_WEATHER ACTION: World '" + worldName + "' not found!");
                return;
            }

            switch (weatherType) {
                case "SUN":
                    world.setStorm(false);
                    world.setThundering(false);
                    break;
                case "STORM":
                    world.setStorm(true);
                    world.setThundering(false);
                    break;
                case "THUNDER":
                    world.setStorm(true);
                    world.setThundering(true);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_WEATHER ACTION: Unknown weather type: " + weatherType);
                    return;
            }

            if (duration !== null) {
                world.setWeatherDuration(duration * 20);
            }
        }
    });

    var changeWeatherInstance = new ChangeWeatherAction("change_weather");

    return changeWeatherInstance;
}

CEchangeWeather();