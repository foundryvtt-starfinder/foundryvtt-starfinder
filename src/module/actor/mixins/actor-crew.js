export const ActorCrewMixin = (superclass) => class extends superclass {
    async removeFromCrew(actorId) {
        const role = this.getCrewRoleForActor(actorId);
        if (role) {
            const crewData = duplicate(this.system.crew);
            crewData[role].actorIds = crewData[role].actorIds.filter(x => x !== actorId);
            return this.update({
                "system.crew": crewData
            });
        }
        return null;
    }
    
    getCrewRoleForActor(actorId) {
        const dataSource = this;
        const acceptedActorTypes = ["starship", "vehicle"];
        if (!acceptedActorTypes.includes(dataSource.type)) {
            console.log(`getCrewRoleForActor(${actorId}) called on an actor (${dataSource.id}) of type ${dataSource.type}, which is not supported!`);
            console.trace();
            return null;
        }

        if (!dataSource?.system.crew) {
            return null;
        }

        for (const [role, entry] of Object.entries(dataSource.system.crew)) {
            if (entry?.actorIds?.includes(actorId)) {
                return role;
            }
        }
        return null;
    }

    getActorIdsForCrewRole(role) {
        const acceptedActorTypes = ["starship", "vehicle"];
        if (!acceptedActorTypes.includes(this.type)) {
            console.log(`getActorIdsForCrewRole(${role}) called on an actor (${this.id}) of type ${this.type}, which is not supported!`);
            console.trace();
            return null;
        }

        if (!this.system?.crew) {
            return null;
        }

        if (!(role in this.system.crew)) {
            return null;
        }

        return duplicate(this.system.crew[role]);
    }
}
