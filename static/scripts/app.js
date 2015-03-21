var s;
var CANVAS_WIDTH = 900;
var CANVAS_HEIGHT = 600;

var filterKeywords = {
    substance: {
        proteins: [],
        hormones: {
            amine: [],
            peptide: []
        },
        neurotransmitters: []
    },
    structure: {},
    process: {},
}

var Node = function(id, name) {
    this.id = id;
    this.name = name;
};

var Edge = function(id, source, target, name) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.name = name;
    this.links = [];
};

_.extend(Edge.prototype, {
    addLink: function(link) {
        if (!_.find(this.links, function(existingLink) {
            return existingLink === link;
        })) {
            this.links.push(link);
        }
    }
});

var nodes = [];
var edges = [];
var g = {
    nodes: [],
    edges: []
};

window.addEventListener('load', function() {
    populateNodeFilterer();

    s = new sigma({
        graph: g,
        renderer: {
            container: document.getElementById('graph-container'),
            type: 'canvas'
        },
        settings: {
            minEdgeSize: 0.5,
            maxEdgeSize: 4,
            enableEdgeHovering: true,
            edgeHoverSizeRatio: 1,
            edgeHoverExtremities: true
        }
    });

    s.bind('clickNode', function(e) {
        handleClickNode(e.data.node);
    });

    s.bind('overEdge outEdge clickEdge', function(e) {
        console.log('event', e);
        handleClickEdge(e.data.edge);
    });

    s.bind('clickStage', function(e) {
        handleClickStage();
    });

    fetchRelations();
});

function populateNodeFilterer() {
    // TODO populate the keywords in the top slider bar dynamically here
}

function fetchRelations() {
    websocketClient();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function handleOnMessage(relation) {

    if (nodes.length > 75) return;
    var subjectNode = _.find(nodes, function(node) {
        return node.name === relation.subject;
    });

    if (!subjectNode) {
        subjectNode = new Node(nodes.length, relation.subject);
        nodes.push(subjectNode);
        s.graph.addNode({
          id: subjectNode.id.toString(),
          label: subjectNode.name,
          x: getRandomInt(0, CANVAS_WIDTH),
          y: getRandomInt(0, CANVAS_HEIGHT),
          size: 1,
        });
    }

    var objectNode = _.find(nodes, function(node) {
        return node.name === relation.object;
    });

    if (!objectNode) {
        objectNode = new Node(nodes.length, relation.object);
        nodes.push(objectNode);
        s.graph.addNode({
          id: objectNode.id.toString(),
          label: objectNode.name,
          x: getRandomInt(0, CANVAS_WIDTH),
          y: getRandomInt(0, CANVAS_HEIGHT),
          size: 1,
        });
    }

    var edge = _.find(edges, function(edge) {
        return edge.source === subjectNode.id
                && edge.target === objectNode.id 
                && edge.name === relation.predicate;
    });

    if (!edge) {
        edge = new Edge(edges.length, subjectNode.id, objectNode.id, relation.predicate);
        edges.push(edge);
        s.graph.addEdge({
          id: edge.id.toString(),
          source: edge.source.toString(),
          target: edge.target.toString(),
          label: edge.name,
          type: "arrow"
        });
    }

    edge.addLink(relation.link);

    s.refresh();
}

function handleClickNode(node) {
    $('#dp-name').text(node.label).show();
    $('#dp-description').text('A description of ' + node.label + '.').show();

    // find edges whose subject is this node
    var outwardEdges = _.filter(edges, function(edge) {
        return edge.source.toString() === node.id;
    });

    var groupedEdges = _.groupBy(outwardEdges, function(edge) {
        return edge.name;
    });

    console.log('edges', outwardEdges);
    console.log('groupedEdges', groupedEdges);

    if (_.keys(groupedEdges).length > 0) {
        $('#subject-verb-histogram').highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Verb Frequency'
            },
            xAxis: {
                categories: _.keys(groupedEdges),
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Frequency',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Frequency',
                data: _.map(groupedEdges, function(group) {
                    return group.length;
                })
            }]
        });
    }
}

function handleClickEdge(edge) {
    console.log(edge);
}

function handleClickStage() {

}

function applyLayout() {
    s.startForceAtlas2({
        linLogMode: false,
        edgeWeightInfluence: 0.2,
        scalingRatio: 100,
        iterationsPerRender: 10000
    });
}

function stopLayout() {
    s.stopForceAtlas2();
}