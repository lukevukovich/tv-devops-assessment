import { App } from "cdktf";
import { getConfig } from "./src/config";
import { DevOpsStack } from "./src/stack";

const app = new App();
const config = getConfig();
new DevOpsStack(app, "tv-devops", config);
app.synth();
