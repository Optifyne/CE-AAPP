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

function CEchangeTicksLived() {
    var ChangeTicksLivedAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TICKS_LIVED ACTION: Invalid format! Correct format: change_ticks_lived: <entity_uuid|player_name>;<ticks (not less than 1!)>");
                return;
            }

            var targetIdentifier = args[0].trim();
            var ticks = parseInt(args[1]);
            
            if (ticks < 1) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TICKS_LIVED ACTION: Ticks should not be less than 1.");
                return;
            }
            
            var targetEntity = null;
            try {
                targetEntity = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                targetEntity = Bukkit.getPlayer(targetIdentifier);
            }

            if (targetEntity == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TICKS_LIVED ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }
            
            targetEntity.setTicksLived(ticks);
        }
    });

    var changeTicksLivedInstance = new ChangeTicksLivedAction("change_ticks_lived");
    
    return changeTicksLivedInstance;
}

CEchangeTicksLived();
