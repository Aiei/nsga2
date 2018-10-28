export namespace MOEA 
{
    export class NSGA2 
    {
        chromosomeSize: number;
        objectiveSize: number;
        populationSize: number;
        maxGenerations: number;
        mutationRate: number = 0;
        crossoverRate: number = 0;
        objectiveFunction: Function;
        genomeFunction: Function;

        constructor(
            chromosomeSize: number, 
            objectiveSize: number,
            populationSize: number,
            maxGenerations: number,
            objectiveFunction: Function,
            genomeFunction: Function
        ) {
            this.chromosomeSize = chromosomeSize;
            this.objectiveSize = objectiveSize;
            this.populationSize = populationSize;
            this.maxGenerations = maxGenerations;
            this.genomeFunction = genomeFunction;
            this.objectiveFunction = objectiveFunction;
        }

        optimize(frontOnly: boolean = false): any {
            let timeStamp = Date.now();
            // First parents
            let pop: Individual[];
            pop = this.initPopulation(pop);
            this.sort(pop);
            pop = this.setCrowdingDistances(pop);
            // Main loop
            let generationCount: number = 1;
            while (generationCount < this.maxGenerations) {
                let offsprings = this.generateOffsprings(pop);
                pop = pop.concat(offsprings);
                let sortedPop = this.sort(pop);
                pop = this.setCrowdingDistances(pop);
                let nextPop: Individual[] = [];
                let sortedPopLength = sortedPop.length;
                for (let i = 0; i < sortedPopLength; i++) {
                    if (sortedPop[i].length + nextPop.length <= this.populationSize)
                    {
                        nextPop = nextPop.concat(sortedPop[i]);
                    } else if (nextPop.length < this.populationSize) {
                        this.sortByCrowdingDistance(sortedPop[i]);
                        let j = 0;
                        while (nextPop.length < this.populationSize) {
                            nextPop.push(sortedPop[i][j]);
                            j++;
                        }
                    }
                }
                pop = nextPop;
                generationCount++;
            }
            // Timestamp
            console.log("NSGA2 Finished in " + (Date.now() - timeStamp) + 
                " milliseconds.");
            // Return pareto fronts only
            if (frontOnly) {
                let fpop: Individual[] = [];
                for (let p of pop) {
                    if (p.paretoRank == 1) {
                        fpop.push(p);
                    }
                }
                return fpop;
            }
            return pop;
        }



        protected initPopulation(population: Individual[]): Individual[] {
            population = [];
            for (let i = 0; i < this.populationSize; i++) {
                population[i] = this.createRandomIndividual();
            }
            return population;
        }

        protected createRandomIndividual(): Individual {
            let newIndividual = new Individual();
            for (let i = 0; i < this.chromosomeSize; i++) {
                newIndividual.chromosome[i] = this.genomeFunction();
            }
            newIndividual.calculateObjectives(this.objectiveFunction);
            return newIndividual;
        }

        protected sort(individuals: Individual[]): Individual[][] {
            let fronts: Individual[][] = [];
            fronts[0] = [];
            let l = individuals.length;
            for (let i = 0; i < l; i++) {
                individuals[i].individualsDominated = [];
                individuals[i].dominatedCount = 0;
                for (let j = 0; j < l; j++) {
                    if (i == j) { continue; }
                    if (individuals[i].dominate(individuals[j])) {
                        individuals[i].individualsDominated
                            .push(individuals[j]);
                    } else if (individuals[j].dominate(individuals[i])) {
                        individuals[i].dominatedCount += 1;
                    }
                }
                if (individuals[i].dominatedCount <= 0) {
                    individuals[i].paretoRank = 1;
                    fronts[0].push(individuals[i]);
                }
            }
            let rank = 0;
            // [i-1] because stupid scientists always start arrays at 1
            while (fronts[rank].length > 0) {
                let nextFront: Individual[] = [];
                for (let k = 0; k < fronts[rank].length; k++) {
                    for (let j = 0; j < fronts[rank][k].individualsDominated.length; j++) {
                        fronts[rank][k].individualsDominated[j]
                            .dominatedCount -= 1;
                        if (fronts[rank][k].individualsDominated[j].dominatedCount == 0) {
                            fronts[rank][k].individualsDominated[j]
                                .paretoRank = rank + 2;
                            nextFront.push(
                                fronts[rank][k].individualsDominated[j]);
                        }
                    }
                }
                rank += 1;
                fronts[rank] = nextFront;
            }
            return fronts;
        }

        protected setCrowdingDistances(individuals: Individual[]): Individual[] {
            for (let i = 0; i < individuals.length; i++) {
                individuals[i].crowdingDistance = 0;
            }
            for (let m = 0; m < this.objectiveSize; m++) {

                let objectiveMin: number = Infinity;
                let objectiveMax: number = 0;
                for (let idv of individuals) {
                    if (idv.objectives[m] > objectiveMax) {
                        objectiveMax = idv.objectives[m];
                    }
                    if (idv.objectives[m] < objectiveMin) {
                        objectiveMin = idv.objectives[m];
                    }
                }

                this.sortByObjective(individuals, m);
                // Prevent NaN
                if (objectiveMax - objectiveMin <= 0) {
                    continue;
                }
                individuals[0].crowdingDistance = Infinity;
                let lastIndex = individuals.length - 1;
                individuals[lastIndex].crowdingDistance = Infinity;
                for (let i = 1; i < individuals.length - 1; i++) {
                    individuals[i].crowdingDistance =
                        individuals[i].crowdingDistance + 
                        (
                            (individuals[i+1].objectives[m] - 
                                individuals[i-1].objectives[m])
                            / (objectiveMax - objectiveMin)
                        );
                }
            }
            return individuals;
        }

        protected sortByObjective(individuals: Individual[], objectiveId: number) {
            let tmp;
            for (let i = 0; i < individuals.length; i++) {
                for (let j = i; j > 0; j--) {
                    if (individuals[j].objectives[objectiveId] - 
                        individuals[j - 1].objectives[objectiveId] < 0) 
                    {
                        tmp = individuals[j];
                        individuals[j] = individuals[j - 1];
                        individuals[j - 1] = tmp;
                    }
                }
            }
        }

        protected generateOffsprings(parents: Individual[]): Individual[] {
            let offsprings: Individual[] = [];
            while (offsprings.length < this.populationSize) {
                let parentA = this.getGoodParent(parents);
                let parentB = this.getGoodParent(parents);
                let childs = this.mate(parentA, parentB);
                offsprings.push(childs[0], childs[1]);
            }
            return offsprings;
        }

        protected mate(parentA: Individual, parentB: Individual): Individual[] {
            // Create two childs
            let childs = [new Individual(), new Individual()];
            childs[0].chromosome = 
                parentA.chromosome.slice(0, this.chromosomeSize);
            childs[1].chromosome = 
                parentB.chromosome.slice(0, this.chromosomeSize);
            // Crossovers
            this.crossover(childs[0], childs[1], this.crossoverRate);
            // Mutations
            this.mutate(childs[0], this.mutationRate);
            this.mutate(childs[1], this.mutationRate);
            childs[0].calculateObjectives(this.objectiveFunction);
            childs[1].calculateObjectives(this.objectiveFunction);
            return childs;
        }

        protected crossover(a: Individual, b: Individual, rate: number) {
            for (let i = 0; i < this.chromosomeSize; i++) {
                if (Math.random() < this.crossoverRate) {
                    let tmp = a.chromosome[i];
                    a.chromosome[i] = b.chromosome[i];
                    b.chromosome[i] = tmp;
                }
            }
        }

        protected mutate(individual: Individual, rate: number) {
            for (let i = 0; i < individual.chromosome.length; i++) {
                if (Math.random() < rate) {
                    individual.chromosome[i] = this.genomeFunction();
                }
            }
        }

        protected getGoodParent(parents: Individual[]): Individual {
            let r: number[];
            do {
                r = [
                    Math.floor(Math.random() * parents.length), 
                    Math.floor(Math.random() * parents.length)
                ];
            } while (r[0] == r[1]);
            if (parents[r[0]].paretoRank < parents[r[1]].paretoRank) {
                return parents[r[0]];
            }
            if (parents[r[0]].paretoRank > parents[r[1]].paretoRank) {
                return parents[r[1]];
            }
            if (parents[r[0]].paretoRank == parents[r[1]].paretoRank) {
                if (parents[r[0]].crowdingDistance >=
                    parents[r[1]].crowdingDistance) {
                    return parents[r[0]];
                }
                if (parents[r[0]].crowdingDistance < 
                    parents[r[1]].crowdingDistance) {
                    return parents[r[1]];
                }
            }
        }

        protected sortByCrowdingDistance(individuals: Individual[]) {
            let tmp;
            for (let i = 0; i < individuals.length; i++) {
                for (let j = i; j > 0; j--) {
                    if (individuals[j].crowdingDistance - 
                        individuals[j - 1].crowdingDistance < 0) 
                    {
                        tmp = individuals[j];
                        individuals[j] = individuals[j - 1];
                        individuals[j - 1] = tmp;
                    }
                }
            }
            individuals.reverse();
        }
    }

    export class Individual 
    {
        chromosome: any[];
        objectives: number[];
        paretoRank: number;
        individualsDominated: Individual[];
        dominatedCount: number;
        crowdingDistance: number;

        constructor() {
            this.chromosome = [];
            this.objectives = [];
        }

        calculateObjectives(objectiveFunction: Function) {
            this.objectives = objectiveFunction(this.chromosome);
        }

        dominate(other: Individual): boolean {
            let l = this.objectives.length;
            for (let i = 0; i < l; i++) {
                if (this.objectives[i] > other.objectives[i]) {
                    return false;
                }
            }
            return true;
        }
    }
}