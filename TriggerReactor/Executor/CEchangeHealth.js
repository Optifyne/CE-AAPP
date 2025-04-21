/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty as to
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");

function CEchangeHealth() {
    var ChangeHealthAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2 || args.length > 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HEALTH ACTION: Invalid actionLine format! CORRECT FORMAT: change_health: <entity_uuid|player_name>;<health_amount>;(optional) <mode (may be \"max\")>");
                return;
            }

            var targetIdentifier = args[0].trim();
            var healthAmount = parseFloat(args[1].trim());
            var healthMode = args.length === 3 ? args[2].trim().toLowerCase() : null;
            
            if (isNaN(healthAmount) || healthAmount < 0) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HEALTH ACTION: Invalid health amount: " + args[1]);
                return;
            }

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                target = Bukkit.getPlayer(targetIdentifier);
            }
            
            if (target == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HEALTH ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }

            if (healthMode === "max") {
                healthAmount = target.getMaxHealth();
            }

            target.setHealth(healthAmount);
        }
    });

    var changeHealthInstance = new ChangeHealthAction("change_health");

    return changeHealthInstance;
}

CEchangeHealth();