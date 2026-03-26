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

function CEchangeInvulnerable() {
    var ChangeInvulnerableAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_INVULNERABLE ACTION: Invalid format! Correct format: change_invulnerable: <entity_uuid|player_name>;<mode (invulnerable|noDamageTicks)>;<value (true|false in invulnerable mode or ticks duration in noDamageTicks mode)>");
                return;
            }

            var identifier = args[0].trim();
            var mode = args[1].trim();
            var value = args[2].trim();

            var target = null;
            try {
                var uuid = UUID.fromString(identifier);
                target = Bukkit.getEntity(uuid);
            } catch (e) {
                target = Bukkit.getPlayer(identifier);
            }

            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_INVULNERABLE ACTION: Entity not found for: " + identifier);
                return;
            }
            			
            switch (mode) {
                case "invulnerable":
                    target.setInvulnerable(value === "true");
                    break;
                case "noDamageTicks":
                    if (target instanceof LivingEntity) {
                        try {
                            target.setNoDamageTicks(parseInt(value));
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_INVULNERABLE ACTION: Invalid value.");
                            return;
                        }
                        break;
                    } else {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_INVULNERABLE ACTION: Entity is not LivingEntity!");
                        return;
                    }
                default:
                	Bukkit.getLogger().warning("[CEActions] CHANGE_INVULNERABLE ACTION: Invalid mode.");
            }
        }
    });

    var changeInvulnerableInstance = new ChangeInvulnerableAction("change_invulnerable");
    
    return changeInvulnerableInstance;
}

CEchangeInvulnerable();