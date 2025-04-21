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
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var UUID = Java.type("java.util.UUID");

function CEchangeEffect() {
    var ChangeEffectAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_EFFECT ACTION: Invalid format! CORRECT FORMAT: change_effect: <entity_uuid|player_name>;<ADD|REMOVE|REMOVE_ALL>;<effect>;<strength>;<duration>");
                return;
            }

            var targetIdentifier = args[0];
            var action = args[1].toUpperCase();
            var effectName = args.length > 2 ? args[2].toUpperCase() : null;
            var strength = args.length > 3 ? parseInt(args[3]) - 1 : 0;
            var duration = args.length > 4 ? parseInt(args[4]) : 200;

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                target = Bukkit.getPlayer(targetIdentifier);
            }

            if (target == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_EFFECT ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }

            switch (action) {
                case "ADD":
                    var effectType = PotionEffectType.getByName(effectName);
                    if (effectType == null) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_EFFECT ACTION: Invalid effect name: " + effectName + " (is this what effect is called on your server version?)");
                        return;
                    }
                    target.addPotionEffect(new PotionEffect(effectType, duration, strength));
                    break;
                case "REMOVE":
                    var effectType = PotionEffectType.getByName(effectName);
                    if (effectType == null) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_EFFECT ACTION: Invalid effect name: " + effectName + " (is this what effect is called on your server version?)");
                        return;
                    }
                    target.removePotionEffect(effectType);
                    break;
                case "REMOVE_ALL":
                    target.getActivePotionEffects().forEach(function(effect) {
                        target.removePotionEffect(effect.getType());
                    });
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_EFFECT ACTION: Invalid action type: " + action);
            }
        }
    });

    var changeEffectInstance = new ChangeEffectAction("change_effect");
    return changeEffectInstance;
}

CEchangeEffect();