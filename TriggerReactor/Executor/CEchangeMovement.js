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
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var Sittable = Java.type("org.bukkit.entity.Sittable");

function CEchangeMovement() {
    var ChangeMovementAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Invalid format! Correct format: change_movement: <entity_uuid|player_name>;<action (sprint, sneak, swim or sit)>;<state (true|false)>");
                return;
            }

            var identifier = args[0].trim();
            var action = args[1].trim().toLowerCase();
            var state = args[2].trim().toLowerCase() === "true";
            
            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(identifier));
            } catch (e) {
                target = Bukkit.getPlayer(identifier);
            }

            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Entity not found for: " + identifier);
                return;
            }
			
            switch (action) {
                case "sprint":
                    if (!(target instanceof Player)) {
                    	Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Target is not a Player!");
                		return;
                    }
                    target.setSprinting(state);
                    break;
                case "sneak":
                    if (!(target instanceof Player)) {
                    	Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Target is not a Player!");
                		return;
                    }
                    target.setSneaking(state);
                    break;
                case "swim":
                    if (!(target instanceof LivingEntity)) {
                    	Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Target is not a LivingEntity!");
                		return;
                    }
                    target.setSwimming(state);
                    break;
                case "sit":
                    if (!(target instanceof Sittable)) {
                    	Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Target is not a Sittable!");
                		return;
                    }
                    target.setSitting(state);
                    break;
                default:
					Bukkit.getLogger().warning("[CEActions] CHANGE_MOVEMENT ACTION: Invalid action, use 'sprint', 'sneak', 'swim' or 'sit'.");
                	return;
            }
        }
    });

    var changeMovementInstance = new ChangeMovementAction("change_movement");
    
    return changeMovementInstance;
}

CEchangeMovement();