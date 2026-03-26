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
var Projectile = Java.type("org.bukkit.entity.Projectile");
var EntityShootBowEvent = Java.type("org.bukkit.event.entity.EntityShootBowEvent");

function CEchangeProjectile() {
    var ChangeProjectileAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            if (!(minecraftEvent instanceof EntityShootBowEvent)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_PROJECTILE ACTION: The event is not a EntityShootBowEvent!");
                return;
            }
            
            var args = actionLine.split(";");
            if (args.length < 1) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_PROJECTILE ACTION: Invalid format! Correct format: change_projectile: <projectile_type|projectile_uuid (for example, Arrow or Snowball, or UUID of some already existed projectile)>");
                return;
            }

            var projectileData = args[0].trim();
            
            var location = minecraftEvent.getProjectile().getLocation();
            var projectileClass = null;
            try {
            	projectileClass = Bukkit.getEntity(UUID.fromString(projectileData)).getType().getEntityClass();
            } catch (e) {
                projectileClass = Java.type("org.bukkit.entity." + projectileData);
                if (!Projectile.class.isAssignableFrom(projectileClass.class)) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_PROJECTILE ACTION: Invalid projectile type or UUID!");
                    return;
                }
                projectileClass = projectileClass.class;
            }
                
			var newProjectile = location.getWorld().spawn(location, projectileClass);
            
            newProjectile.setVelocity(minecraftEvent.getProjectile().getVelocity());
            minecraftEvent.setProjectile(newProjectile);
        }
    });

    var changeProjectileInstance = new ChangeProjectileAction("change_projectile");
    
    return changeProjectileInstance;
}

CEchangeProjectile();