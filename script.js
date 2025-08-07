let graphNodes = [];
let selectedConnection;
class GraphNode {
    constructor(title, x = 50, y = 50) {
        this.div = document.createElement("div");
        this.div.id = "node-" + Math.random().toString(36).substring(2, 11);
        this.div.style.width = "150px";
        this.div.style.height = "150px";
        this.div.style.position = "absolute";
        this.div.style.left = `${x}px`;
        this.div.style.top = `${y}px`;
        this.div.style.border = "1px solid black";
        this.div.style.cursor = "move";

        this.title = document.createElement("p");
        this.title.textContent = title;
        this.title.style.textAlign = "center";
        this.title.style.margin = "0";
        this.title.style.position = "absolute";
        this.title.style.top = "50%";
        this.title.style.left = "50%";
        this.title.style.transform = "translate(-50%, -50%)";
        this.title.style.width = "100%";
        this.div.appendChild(this.title);

        this.title.addEventListener("dblclick", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = this.title.textContent;
            input.style.width = `${this.title.offsetWidth}px`;
            input.style.margin = "0 auto";
            input.style.display = "block";
            input.style.textAlign = "center";
            input.style.boxSizing = "border-box";
            input.style.position = "absolute";
            input.style.top = "50%";
            input.style.left = "50%";
            input.style.transform = "translate(-50%, -50%)";
            this.div.replaceChild(input, this.title);
            input.focus();

            const save = () => {
                this.title.textContent = input.value;
                this.div.replaceChild(this.title, input);
            };
            input.addEventListener("blur", save);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    input.blur();
                }
            });
        });

        this.deleteButton = document.createElement("button");
        this.deleteButton.textContent = "x";
        this.deleteButton.style.position = "absolute";
        this.deleteButton.style.top = "0";
        this.deleteButton.style.right = "0";
        this.deleteButton.style.background = "red";
        this.deleteButton.style.color = "white";
        this.deleteButton.style.border = "none";
        this.deleteButton.style.cursor = "pointer";
        this.deleteButton.addEventListener("click", () => {
            jsPlumb.removeAllEndpoints(this.div);
            graphNodes = graphNodes.filter(el => el.div.id !== this.div.id);
            document.body.removeChild(this.div);
        });
        this.div.appendChild(this.deleteButton);

        document.body.appendChild(this.div);
    }

    jsPlumbReady(jsPlumb) {
        this.jsPlumb = jsPlumb;
        this.jsPlumb.draggable(this.div);
        this.source = {
            isSource: true,
            isTarget: true,
            maxConnections: -1,
            connector: "Straight",
            endpoint: "Dot",
            paintStyle: { fill: "blue", radius: 5 },
            connectorStyle: { stroke: "black", strokeWidth: 2 }
        };
    }
}


class ExampleNode extends GraphNode {
    constructor(x, y) {
        super("Example", x, y);
    }

    jsPlumbReady(jsPlumb) {
        super.jsPlumbReady(jsPlumb);
        this.jsPlumb.addEndpoint(this.div, { anchors: [0.5, 1] }, { ...this.source, uuid: this.div.id + "-top" });
        this.jsPlumb.addEndpoint(this.div, { anchors: [0.5, 0] }, { ...this.source, uuid: this.div.id + "-bottom" });
        this.jsPlumb.addEndpoint(this.div, { anchors: [1, 0.5] }, { ...this.source, uuid: this.div.id + "-right" });
        this.jsPlumb.addEndpoint(this.div, { anchors: [0, 0.5] }, { ...this.source, uuid: this.div.id + "-left" });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let element1 = new ExampleNode(100, 100);
    let element2 = new ExampleNode(300, 100);
    let element3 = new ExampleNode(500, 100);
    graphNodes.push(element1, element2, element3);
    jsPlumb.ready(function () {
        graphNodes.forEach(element => {
            element.jsPlumbReady(jsPlumb);
        });

        jsPlumb.bind("connection", function (info) {
            if (info.sourceId === info.targetId) {
                jsPlumb.deleteConnection(info.connection);
                return;
            }
            console.log("Connection established from", info.sourceId, "to", info.targetId);
        });

        jsPlumb.bind("connectionMoved", function (info) {
            console.log("Connection moved", info);
        });

        jsPlumb.bind("connectionDetached", function (info) {
            console.log("Connection detached", info);
        });
    });
});
