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
var UUID = Java.type("java.util.UUID");
var Entity = Java.type("org.bukkit.entity.Entity");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Runnable = Java.type("java.lang.Runnable");
var EntityDamageEvent = Java.type("org.bukkit.event.entity.EntityDamageEvent");
var DamageCause = Java.type("org.bukkit.event.entity.EntityDamageEvent.DamageCause");
var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");

function CEchangeAir() {
    var ChangeAirAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";", 5);
            if (args.length < 4) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AIR ACTION: Invalid format! Correct format: change_air: <entity_uuid|player_name>;<operation (may be SET, ADD, REMOVE, MULTIPLY or DIVIDE)>;<mode (may be CURRENT or MAX)>;<value_in_ticks>;(optional, only in case of CURRENT mode and if the player is on land) <damageOnDrowning (true|false)>");
                return;
            }

            var entityId = args[0].trim();
            var operation = args[1].trim().toUpperCase();
            var mode = args[2].trim().toUpperCase();
            var value = parseInt(args[3].trim());
            var damageOnDrowning = args.length === 5 ? args[4].trim().toLowerCase() === "true" : false;

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(entityId));
            } catch (e) {
                target = Bukkit.getPlayer(entityId);
            }
            
            if (!target || !(target instanceof LivingEntity)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AIR ACTION: Target entity not found or entity is not a LivingEntity.");
                return;
            }

            var world = target.getWorld();
            var isInWater = target.isInWater();
            var currentAir = target.getRemainingAir();
            var maxAir = target.getMaximumAir();
            var minAir = -20;
            var newAir = currentAir;

            switch (operation) {
                case "SET":
                    newAir = value;
                    break;
                case "ADD":
                    newAir = (mode === "MAX" ? maxAir : currentAir) + value;
                    break;
                case "REMOVE":
                    newAir = (mode === "MAX" ? maxAir : currentAir) - value;
                    break;
                case "MULTIPLY":
                    newAir = (mode === "MAX" ? maxAir : currentAir) * value;
                    break;
                case "DIVIDE":
                    newAir = Math.floor((mode === "MAX" ? maxAir : currentAir) / value);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_AIR ACTION: Invalid operation: " + operation);
                    return;
            }
                        
            function handleAirReduction(target, initialAir, damageOnDrowning) {
                var newOxygen = initialAir;
                var currentOxygen = target.getMaximumAir();
                var previousOxygen = currentOxygen;
				
                var damageTask = null;
                var task = Bukkit.getScheduler().scheduleSyncRepeatingTask(plugin, new Runnable({
                    run: function() {
                        if (target.isDead() || !target.isValid() || previousOxygen > currentOxygen || currentOxygen === newOxygen) {
                            if (damageTask) {
                            	Bukkit.getScheduler().cancelTask(damageTask);
                            }
                            Bukkit.getScheduler().cancelTask(task);
                            return;
                        }

                        currentOxygen -= 1;

                        if (currentOxygen === -10) {
                            target.setRemainingAir(currentOxygen);
                            if (damageOnDrowning) {
								damageTask = Bukkit.getScheduler().scheduleSyncRepeatingTask(plugin, new Runnable({
                                    run: function() {
                                        if (!target.isDead() && target.isValid()) {
                    						target.damage(2);
                                        } else {
                                            Bukkit.getScheduler().cancelTask(damageTask);
                                        }
                                    }
                                }), 20, 20);
                            }
                        }

                        target.setRemainingAir(currentOxygen);
                        
                        previousOxygen = target.getRemainingAir();
                    }
                }), 0, 1);
            }

        	mode === "MAX" ? target.setMaximumAir(newAir) : isInWater ? target.setRemainingAir(newAir) : handleAirReduction(target, newAir, damageOnDrowning);
        }
    });

    var changeAirInstance = new ChangeAirAction("change_air");
    return changeAirInstance;
}

CEchangeAir();