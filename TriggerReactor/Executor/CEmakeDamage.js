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

function CEmakeDamage() {
    var MakeDamageAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2 || args.length > 3) {
                Bukkit.getLogger().warning("[CEActions] MAKE_DAMAGE ACTION: Invalid actionLine format! CORRECT FORMAT: make_damage: <entity_uuid|player_name>;<damage_amount>;(optional) <damager_uuid|player_name (for damager)>");
                return;
            }

            var targetIdentifier = args[0].trim();
            var damageAmount = parseFloat(args[1].trim());
            var damagerIdentifier = args.length === 3 ? args[2].trim() : null;
            
            if (isNaN(damageAmount) || damageAmount <= 0) {
                Bukkit.getLogger().warning("[CEActions] MAKE_DAMAGE ACTION: Invalid damage amount: " + args[1]);
                return;
            }

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                target = Bukkit.getPlayer(targetIdentifier);
            }
            
            if (target == null) {
                Bukkit.getLogger().warning("[CEActions] MAKE_DAMAGE ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }

            var damager = null;
            if (damagerIdentifier != null) {
                try {
                    damager = Bukkit.getEntity(UUID.fromString(damagerIdentifier));
                } catch (e) {
                    damager = Bukkit.getPlayer(damagerIdentifier);
                }

                if (damager == null) {
                    Bukkit.getLogger().warning("[CEActions] MAKE_DAMAGE ACTION: Damager entity or player not found: " + damagerIdentifier);
                    return;
                }
            }

            if (damager != null) {
                target.damage(damageAmount, damager);
            } else {
                target.damage(damageAmount);
            }
        }
    });

    var makeDamageInstance = new MakeDamageAction("make_damage");

    return makeDamageInstance;
}

CEmakeDamage();