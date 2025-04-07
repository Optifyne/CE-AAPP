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

function CEchangeFire() {
    var ChangeFireAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_FIRE ACTION: Invalid actionLine format! CORRECT FORMAT: change_fire: <entity_uuid|player_name>;<duration (in ticks)>;(optional) <visual (true|false)>");
                return;
            }

            var targetIdentifier = args[0];
            var duration = parseInt(args[1]);
            var visual = args[2] ? args[2] === "true" : null;
            
            if (isNaN(duration) || duration <= 0) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_FIRE ACTION: Invalid duration value: " + args[1]);
                return;
            }
            
            var target = null;
            try {
                var uuid = UUID.fromString(targetIdentifier);
                target = Bukkit.getEntity(uuid);
            } catch (e) {
                target = Bukkit.getPlayer(targetIdentifier);
            }
            
            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_FIRE ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }
            
            visual !== null ? target.setVisualFire(visual) : target.setFireTicks(duration);
        }
    });

    var changeFireInstance = new ChangeFireAction("change_fire");

    return changeFireInstance;
}

CEchangeFire();