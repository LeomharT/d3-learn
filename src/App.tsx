//@ts-nocheck
import * as d3 from 'd3';
import { useEffect } from 'react';
import fiare2 from './flare2.json';

export default function App() {
  const initial = () => {
    const el = document.querySelector('#playground') as HTMLDivElement;
    const rect = el.getBoundingClientRect();

    /**
     * Variables
     */

    // Define chart's dimensions. create tree layout
    const SIZES = {
      WIDTH: rect.width,
      HEIGHT: rect.height,
      MARGIN_TOP: 10,
      MARGIN_RIGHT: 10,
      MARGIN_BOTTOM: 10,
      MARGIN_LEFT: 40,
    };

    /**
     * Tree
     */

    // Mark js tree data to d3 formation tree data
    const root = d3.hierarchy<any>(fiare2);
    // Rows distance, dx is height
    const dx = 20;
    // Column distance, dy is width, column width is equal to tree height
    const dy = (SIZES.WIDTH - SIZES.MARGIN_RIGHT - SIZES.MARGIN_LEFT) / (1 + root.height);

    // Define the tree layout and the shape for links.
    const tree = d3.tree<typeof fiare2>().nodeSize([dx, dy]);

    // Links
    const diagonal = d3
      .linkHorizontal()
      .x((d: any) => d.y)
      .y((d: any) => d.x);

    /**
     * SVG container, a layer (group) for the links and a layer for the nodes.
     */
    const svg = d3
      .create('svg')
      .attr('width', SIZES.WIDTH)
      .attr('height', dx)
      .attr('viewBox', [-SIZES.MARGIN_LEFT, -SIZES.MARGIN_TOP, SIZES.WIDTH, dx]);

    /**
     * Zoom
     */
    svg.call(
      d3
        .zoom()
        .filter((e) => {
          return e.type !== 'dblclick';
        })
        .on('zoom', function (e) {
          rootGroup.attr('transform', () => e.transform);
        })
    );

    // Link group
    const gLink = svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    // Node group
    const gNode = svg.append('g').attr('cursor', 'pointer').attr('pointer-events', 'all');

    function update(event: PointerEvent | null, source: any) {
      console.log(source);

      // hold the alt key to slow down the transition
      const duration = event?.altKey ? 2500 : 250;

      const nodes = root.descendants().reverse();
      const links = root.links();

      // Compute the new tree layout.
      // Treelayout
      tree(root);

      let left = root as any;
      let right = root as any;
      root.eachBefore((node: any) => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      const height = right.x - left.x + SIZES.MARGIN_TOP + SIZES.MARGIN_BOTTOM;

      const transition = svg
        .transition()
        .duration(duration)
        .attr('height', height)
        .attr('viewBox', [-SIZES.MARGIN_LEFT, left.x - SIZES.MARGIN_TOP, SIZES.WIDTH, height] as any)
        .tween('resize', window.ResizeObserver ? null : () => () => svg.dispatch('toggle'));

      // Update the nodes…
      const node = gNode.selectAll('g').data(nodes, (d) => d.id);

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .on('click', (event, d) => {
          d.children = d.children ? null : d._children;
          update(event, d);
        });

      nodeEnter
        .append('circle')
        .attr('r', 2.5)
        .attr('fill', (d) => (d._children ? '#555' : '#999'))
        .attr('stroke-width', 10);

      nodeEnter
        .append('text')
        .attr('dy', '0.31em')
        .attr('x', (d) => (d._children ? -6 : 6))
        .attr('text-anchor', (d) => (d._children ? 'end' : 'start'))
        .text((d) => d.data.name)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-width', 3)
        .attr('stroke', 'white')
        .attr('paint-order', 'stroke');

      // Transition nodes to their new position.
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition(transition)
        .attr('transform', (d) => `translate(${d.y},${d.x})`)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr('transform', (d) => `translate(${source.y},${source.x})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0);

      // Update the links…
      const link = gLink.selectAll('path').data(links, (d) => d.target.id);

      // Enter any new links at the parent's previous position.
      const linkEnter = link
        .enter()
        .append('path')
        .attr('d', (d) => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        });

      // Transition links to their new position.
      link.merge(linkEnter).transition(transition).attr('d', diagonal);

      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition(transition)
        .remove()
        .attr('d', (d) => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      // Stash the old positions for transition.
      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Do the first update to the initial configuration of the tree — where a number of nodes
    // are open (arbitrarily selected as the root, plus nodes with 7 letters).
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      if (d.depth && d.data.name.length !== 7) d.children = null;
    });

    update(null, root);

    el.append(svg.node() ?? '');
  };

  useEffect(() => {
    initial();
  }, []);

  return <div id='playground'></div>;
}
