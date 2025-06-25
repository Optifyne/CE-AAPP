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
var Vector = Java.type("org.bukkit.util.Vector");

function CElaunchProjectile() {
    var LaunchProjectileAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";", 4);
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] LAUNCH_PROJECTILE ACTION: Invalid format! CORRECT FORMAT: launch_projectile: <entity_uuid|player_name>;<projectile_type (for example, Arrow or Snowball>;(optional, for projectile speed) <velocity_x,velocity_y,velocity_z>;(optional, in case of projectile speed, for each direction!) <relative_x,relative_y,relative_z (true|false)>");
                return;
            }

            var targetIdentifier = args[0];
            var projectile = args[1];
            var velocity = args.length >= 3 && args[2] ? args[2].split(",").map(function(str) { return parseFloat(str); }) : null;
            var relativeFlags = args.length === 4 ? args[3].split(",").map(function(str) { return str.toLowerCase() === "true"; }) : [false, false, false];

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                target = Bukkit.getPlayer(targetIdentifier);
            }
            
            if (!target) {
                Bukkit.getLogger().warning("[CEActions] LAUNCH_PROJECTILE ACTION: Target not found: " + targetIdentifier);
                return;
            }
            
			try {
				var projectileClass = Java.type("org.bukkit.entity." + projectile);
				if (!Projectile.class.isAssignableFrom(projectileClass.class)) {
					Bukkit.getLogger().warning("[CEActions] LAUNCH_PROJECTILE ACTION: Invalid projectile type!");
                	return;
				}

				var launchVector = velocity && velocity.length === 3 ? new Vector(
                    relativeFlags[0] && target.getLocation ? target.getLocation().getDirection().getX() * Number(velocity[0]) : Number(velocity[0]),
                    relativeFlags[1] && target.getLocation ? target.getLocation().getDirection().getY() * Number(velocity[1]) : Number(velocity[1]),
                    relativeFlags[2] && target.getLocation ? target.getLocation().getDirection().getZ() * Number(velocity[2]) : Number(velocity[2])
                ) : null;

            	launchVector ? target.launchProjectile(projectileClass.class, launchVector) : target.launchProjectile(projectileClass.class);
            } catch (e) {
                Bukkit.getLogger().warning("[CEActions] LAUNCH_PROJECTILE ACTION: Invalid projectile type: " + projectile);
                return;
            }
        }
    });
    
    var launchProjectileInstance = new LaunchProjectileAction("launch_projectile");
    
    return launchProjectileInstance;
}

CElaunchProjectile();
