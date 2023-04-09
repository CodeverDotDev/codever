## Install graphviz

On Mac:
```bash
brew install graphviz
```

## Generate picture

```bash
cd documentation/graphviz

dot -Tpng components-graph.gv -o components-graph.png
```
