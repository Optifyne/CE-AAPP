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
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");

function CEchangeSpeed() {
    var ChangeSpeedAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SPEED ACTION: Invalid format! Correct format: change_speed: <player>;<mode (WALK or FLY)>;<speed (above -1 and below 1)>");
                return;
            }

            var targetIdentifier = args[0].trim();
            var mode = args[1].trim().toUpperCase();
            var speed = parseFloat(args[2]);
            
            if (speed < -1 || speed > 1) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SPEED ACTION: Invalid speed.");
                return;
            }
            
            var targetEntity = null;
            try {
                targetEntity = Bukkit.getPlayer(targetIdentifier);
            } catch (e) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SPEED ACTION: Player not found: " + targetIdentifier);
                return;
            }
            
            switch (mode) {
                case "WALK":
            		targetEntity.setWalkSpeed(speed);
                    break;
                case "FLY":
            		targetEntity.setFlySpeed(speed);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_SPEED ACTION: Invalid mode, use 'WALK' or 'FLY'.");
                    return;
            }
        }
    });

    var changeSpeedInstance = new ChangeSpeedAction("change_speed");
    
    return changeSpeedInstance;
}

CEchangeSpeed();
