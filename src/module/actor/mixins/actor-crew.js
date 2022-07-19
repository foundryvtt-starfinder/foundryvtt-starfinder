export const ActorCrewMixin = (superclass) => class extends superclass {
    async removeFromCrew(actorId) {
        const role = this.getCrewRoleForActor(actorId);
        if (role) {
            const crewData = duplicate(this.system.crew);
            crewData[role].actorIds = crewData[role].actorIds.filter(x => x !== actorId);
            return this.update({
                "data.crew": crewData
            });
        }
        return null;
    }

    supportsCrew() {
        const acceptedActorTypes = ["starship", "vehicle"];
        return acceptedActorTypes.includes(this.type);
    }
    
    getCrewRoleForActor(actorId) {
        if (!supportsCrew()) {
            console.log(`getCrewRoleForActor(${actorId}) called on an actor (${this.id}) of type ${this.type}, which is not supported!`);
            console.trace();
            return null;
        }

        const actorData = this.system;
        const crewData = actorData.crew;
        if (!crewData) {
            return null;
        }

        for (const [role, entry] of Object.entries(crewData)) {
            if (entry?.actorIds?.includes(actorId)) {
                return role;
            }
        }
        return null;
    }

    getActorIdsForCrewRole(role) {
        if (!supportsCrew()) {
            console.log(`getActorIdsForCrewRole(${role}) called on an actor (${this.id}) of type ${this.type}, which is not supported!`);
            console.trace();
            return null;
        }

        const actorData = this.system;
        const crewData = actorData.crew;
        if (!crewData) {
            return null;
        }

        if (!(role in crewData.crew)) {
            return null;
        }

        return duplicate(crewData.crew[role]);
    }
}
