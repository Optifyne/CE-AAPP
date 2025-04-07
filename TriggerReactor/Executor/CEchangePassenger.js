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
var UUID = Java.type("java.util.UUID");

function CEchangePassenger() {
    var ChangePassengerAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length != 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_PASSENGER ACTION: Invalid actionLine format! CORRECT FORMAT: change_passenger: <vehicle_uuid>;<target_uuid|player_name>;<SET|ADD|REMOVE|REMOVE_ALL>");
                return;
            }

            var vehicleUuid = args[0];
            var targetIdentifier = args[1];
            var action = args[2].toUpperCase();

            var vehicle = null;
            var targetEntity = null;

            try {
                vehicle = Bukkit.getEntity(UUID.fromString(vehicleUuid));
            } catch (e) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_PASSENGER ACTION: Invalid vehicle UUID format: " + vehicleUuid);
                return;
            }

            try {
                targetEntity = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                targetEntity = Bukkit.getPlayer(targetIdentifier);
            }

            if (vehicle == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_PASSENGER ACTION: Vehicle not found: " + vehicleUuid);
                return;
            }

            if (targetEntity == null && action !== "REMOVE_ALL") {
                Bukkit.getLogger().warning("[CEActions] CHANGE_PASSENGER ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }

            switch (action) {
                case "SET":
                    vehicle.setPassenger(targetEntity);
                    break;
                case "ADD":
                    vehicle.addPassenger(targetEntity);
                    break;
                case "REMOVE":
                    vehicle.removePassenger(targetEntity);
                    break;
                case "REMOVE_ALL":
                    vehicle.eject();
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_PASSENGER ACTION: Invalid action: " + action + ". Use 'SET', 'ADD', 'REMOVE', or 'REMOVE_ALL'.");
            }
        }
    });

    var changePassengerInstance = new ChangePassengerAction("change_passenger");

    return changePassengerInstance;
}

CEchangePassenger();