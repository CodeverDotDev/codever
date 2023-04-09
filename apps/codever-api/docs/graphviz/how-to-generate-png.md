## Install graphviz

On Mac:

```bash
brew install graphviz
```

## Generate picture

```bash
cd docs/graphviz

dot -Tpng components-graph.gv -o components-graph.png
```
