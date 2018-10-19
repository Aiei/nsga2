define("nsga2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MOEA;
    (function (MOEA) {
        class NSGA2 {
            constructor(chromosomeSize, objectiveSize, populationSize, maxGenerations, objectiveFunction, genomeFunction) {
                this.mutationRate = 0;
                this.crossoverRate = 0;
                this.chromosomeSize = chromosomeSize;
                this.objectiveSize = objectiveSize;
                this.populationSize = populationSize;
                this.maxGenerations = maxGenerations;
                this.genomeFunction = genomeFunction;
                this.objectiveFunction = objectiveFunction;
            }
            optimize() {
                let timeStamp = Date.now();
                let pop;
                pop = this.initPopulation(pop);
                this.sort(pop);
                this.setCrowdingDistances(pop);
                let generationCount = 1;
                while (generationCount < this.maxGenerations) {
                    let offsprings = this.generateOffsprings(pop);
                    pop = pop.concat(offsprings);
                    let sortedPop = this.sort(pop);
                    this.setCrowdingDistances(pop);
                    let nextPop = [];
                    let sortedPopLength = sortedPop.length;
                    for (let i = 0; i < sortedPopLength; i++) {
                        if (sortedPop[i].length + nextPop.length <= this.populationSize) {
                            nextPop = nextPop.concat(sortedPop[i]);
                        }
                        else if (nextPop.length < this.populationSize) {
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
                console.log("NSGA2 Finished in " + (Date.now() - timeStamp) +
                    " milliseconds.");
                return pop;
            }
            initPopulation(population) {
                population = [];
                for (let i = 0; i < this.populationSize; i++) {
                    population[i] = this.createRandomIndividual();
                }
                return population;
            }
            createRandomIndividual() {
                let newIndividual = new Individual();
                for (let i = 0; i < this.chromosomeSize; i++) {
                    newIndividual.chromosome[i] = this.genomeFunction();
                }
                newIndividual.calculateObjectives(this.objectiveFunction);
                return newIndividual;
            }
            sort(individuals) {
                let fronts = [];
                fronts[0] = [];
                let l = individuals.length;
                for (let i = 0; i < l; i++) {
                    individuals[i].individualsDominated = [];
                    individuals[i].dominatedCount = 0;
                    for (let j = 0; j < l; j++) {
                        if (i == j) {
                            continue;
                        }
                        if (individuals[i].dominate(individuals[j])) {
                            individuals[i].individualsDominated
                                .push(individuals[j]);
                        }
                        else if (individuals[j].dominate(individuals[i])) {
                            individuals[i].dominatedCount += 1;
                        }
                    }
                    if (individuals[i].dominatedCount <= 0) {
                        individuals[i].paretoRank = 1;
                        fronts[0].push(individuals[i]);
                    }
                }
                let rank = 0;
                while (fronts[rank].length > 0) {
                    let nextFront = [];
                    for (let k = 0; k < fronts[rank].length; k++) {
                        for (let j = 0; j < fronts[rank][k].individualsDominated.length; j++) {
                            fronts[rank][k].individualsDominated[j]
                                .dominatedCount -= 1;
                            if (fronts[rank][k].individualsDominated[j].dominatedCount == 0) {
                                fronts[rank][k].individualsDominated[j]
                                    .paretoRank = rank + 2;
                                nextFront.push(fronts[rank][k].individualsDominated[j]);
                            }
                        }
                    }
                    rank += 1;
                    fronts[rank] = nextFront;
                }
                return fronts;
            }
            setCrowdingDistances(individuals) {
                for (let m = 0; m < this.objectiveSize; m++) {
                    let objectiveMin = Infinity;
                    let objectiveMax = 0;
                    for (let idv of individuals) {
                        if (idv.objectives[m] > objectiveMax) {
                            objectiveMax = idv.objectives[m];
                        }
                        if (idv.objectives[m] < objectiveMin) {
                            objectiveMin = idv.objectives[m];
                        }
                    }
                    for (let i = 1; i < individuals.length - 1; i++) {
                        individuals[i].crowdingDistance = 0;
                    }
                    this.sortByObjective(individuals, m);
                    individuals[0].crowdingDistance = Infinity;
                    let lastIndex = individuals.length - 1;
                    individuals[lastIndex].crowdingDistance = Infinity;
                    for (let i = 1; i < individuals.length - 1; i++) {
                        individuals[i].crowdingDistance =
                            individuals[i].crowdingDistance +
                                ((individuals[i + 1].objectives[m] -
                                    individuals[i - 1].objectives[m])
                                    / (objectiveMax - objectiveMin));
                    }
                }
            }
            sortByObjective(individuals, objectiveId) {
                let tmp;
                for (let i = 0; i < individuals.length; i++) {
                    for (let j = i; j > 0; j--) {
                        if (individuals[j].objectives[objectiveId] -
                            individuals[j - 1].objectives[objectiveId] < 0) {
                            tmp = individuals[j];
                            individuals[j] = individuals[j - 1];
                            individuals[j - 1] = tmp;
                        }
                    }
                }
            }
            generateOffsprings(parents) {
                let offsprings = [];
                while (offsprings.length < this.populationSize) {
                    let childs = this.mate(this.getGoodParent(parents), this.getGoodParent(parents));
                    offsprings.push(childs[0], childs[1]);
                }
                return offsprings;
            }
            mate(parentA, parentB) {
                let childs = [new Individual(), new Individual()];
                childs[0].chromosome =
                    parentA.chromosome.slice(0, this.chromosomeSize);
                childs[1].chromosome =
                    parentB.chromosome.slice(0, this.chromosomeSize);
                this.crossover(childs[0], childs[1], this.crossoverRate);
                this.mutate(childs[0], this.mutationRate);
                this.mutate(childs[1], this.mutationRate);
                childs[0].calculateObjectives(this.objectiveFunction);
                childs[1].calculateObjectives(this.objectiveFunction);
                return childs;
            }
            crossover(a, b, rate) {
                for (let i = 0; i < this.chromosomeSize; i++) {
                    if (Math.random() < this.crossoverRate) {
                        let tmp = a.chromosome[i];
                        a.chromosome[i] = b.chromosome[i];
                        b.chromosome[i] = tmp;
                    }
                }
            }
            mutate(individual, rate) {
                for (let i = 0; i < individual.chromosome.length; i++) {
                    if (Math.random() < rate) {
                        individual.chromosome[i] = this.genomeFunction();
                    }
                }
            }
            getGoodParent(parents) {
                let r;
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
            sortByCrowdingDistance(individuals) {
                let tmp;
                for (let i = 0; i < individuals.length; i++) {
                    for (let j = i; j > 0; j--) {
                        if (individuals[j].crowdingDistance -
                            individuals[j - 1].crowdingDistance < 0) {
                            tmp = individuals[j];
                            individuals[j] = individuals[j - 1];
                            individuals[j - 1] = tmp;
                        }
                    }
                }
                individuals.reverse();
            }
        }
        MOEA.NSGA2 = NSGA2;
        class Individual {
            constructor() {
                this.chromosome = [];
                this.objectives = [];
            }
            calculateObjectives(objectiveFunction) {
                this.objectives = objectiveFunction(this.chromosome);
            }
            dominate(other) {
                let l = this.objectives.length;
                for (let i = 0; i < l; i++) {
                    if (this.objectives[i] > other.objectives[i]) {
                        return false;
                    }
                }
                return true;
            }
        }
    })(MOEA = exports.MOEA || (exports.MOEA = {}));
});
define("main", ["require", "exports", "nsga2"], function (require, exports, nsga2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ZDT1(x) {
        let xi = 0;
        for (let i = 1; i < x.length; i++) {
            xi += x[i];
        }
        let g = 1 + (9 / (x.length - 1) * xi);
        let f1 = x[0];
        let f2 = g * (1 - Math.sqrt(f1 / g));
        return [f1, f2];
    }
    function newX() {
        return Math.random();
    }
    let nsga2 = new nsga2_1.MOEA.NSGA2(20, 2, 50, 50, ZDT1, newX);
    nsga2.mutationRate = 0.1;
    nsga2.crossoverRate = 0.5;
    let pop = nsga2.optimize();
    let frontData = [];
    let otherData = [];
    let r = 1;
    for (let i of pop) {
        if (i.paretoRank == r) {
            frontData.push({ x: i.objectives[0], y: i.objectives[1] });
        }
        else {
            otherData.push({ x: i.objectives[0], y: i.objectives[1] });
        }
    }
    let d = [frontData, otherData];
    var cel = document.getElementById("myChart");
    var ctx = cel.getContext('2d');
    var scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                    label: 'pareto front',
                    data: d[0],
                    backgroundColor: 'rgba(0, 50, 255, 1)'
                }, {
                    label: 'data',
                    data: d[1],
                    backgroundColor: 'rgba(0, 0, 0, 0.25)'
                }]
        },
        options: {
            responsive: false,
            scales: {
                xAxes: [{
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            min: 0,
                            max: 1
                        }
                    }],
                yAxes: [{
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            min: 0,
                            max: 10
                        }
                    }]
            }
        }
    });
});
