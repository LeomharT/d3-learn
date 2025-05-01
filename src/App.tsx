//@ts-nocheck
import { Drawer } from 'antd';
import * as d3 from 'd3';
import { useEffect } from 'react';
import data from './placehold.json';
import classes from './style.module.css';

export default function App() {
  const initial = () => {
    const el = document.querySelector('#playground') as HTMLDivElement;
    const rect = el.getBoundingClientRect();

    /**
     * Variables
     */

    // Define chart's dimensions. create tree layout

    const WIDTH = rect.width;
    const MARGIN_TOP = 10;
    const MARGIN_RIGHT = 10;
    const MARGIN_BOTTOM = 10;
    const MARGIN_LEFT = 100;

    /**
     * Tree
     */

    // Mark js tree data to d3 formation tree data
    const root = d3.hierarchy<any>(data);
    // Rows distance, dx is height
    // dx is row gap between every items
    const dx = 100;
    // Column distance, dy is width, column width is equal to tree height
    const dy = (WIDTH - MARGIN_RIGHT - MARGIN_LEFT) / (1 + root.height);

    // Define the tree layout and the shape for links.
    const tree = d3.tree().nodeSize([dx, dy + 180]);

    // Links
    function _diagonal(link: any) {
      const diagonal = d3
        .linkHorizontal()
        .x((d: any) => {
          if (d.y === link.source.y) return d.y + 90;
          if (d.y === link.target.y) return d.y - 90;
          return d.y;
        })
        .y((d: any) => d.x);

      return diagonal(link);
    }

    /**
     * SVG container, a layer (group) for the links and a layer for the nodes.
     */
    const svg = d3
      .create('svg')
      .attr('xmlns', 'http://www.w3.org/1999/xhtml')
      .attr('width', WIDTH)
      .attr('height', dx)
      .attr('viewBox', [-MARGIN_LEFT, -MARGIN_TOP, WIDTH, dx]);

    const rootGroup = svg.append('g');

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
    const gLink = rootGroup
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    // Node group
    const gNode = rootGroup.append('g').attr('cursor', 'pointer').attr('pointer-events', 'all');

    function update(event: PointerEvent | null, source: any) {
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

      const height = right.x - left.x + MARGIN_TOP + MARGIN_BOTTOM;

      const transition = svg
        .transition()
        .duration(duration)
        .attr('height', height)
        .attr('viewBox', [-MARGIN_LEFT, left.x - MARGIN_TOP, WIDTH, height] as any)
        .tween('resize', window.ResizeObserver ? null : () => () => svg.dispatch('toggle'));

      // Update the nodes…
      const node = gNode
        .selectAll('g')
        .data(nodes, (d) => d.id)
        .attr('width', 200);

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', classes.node)
        .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .on('dblclick', (event, d) => {
          d.children = d.children ? null : d._children;
          update(event, d);
        })
        .on('contextmenu', (e: MouseEvent, d) => {
          e.preventDefault();
        });

      // Identifier
      nodeEnter.append('circle');

      // Children length
      nodeEnter
        .append('text')
        .attr('data-children', '')
        .attr('dx', 102)
        .attr('dy', '5')
        .text((d) => (d.children ? d.children.length : d._children?.length ?? ''));

      // Container
      nodeEnter
        .append('foreignObject')
        .attr('class', (d) => classes[`depth${d.depth}`])
        .attr('width', 180)
        .attr('height', 70)
        .attr('x', -90)
        .attr('y', -35)
        .append('xhtml:div')
        .attr('class', classes.content)
        .append('xhtml:span')
        .text((d) => d.data.name);

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
          return _diagonal({ source: o, target: o });
        });

      // Transition links to their new position.
      link
        .merge(linkEnter)
        .transition(transition)
        .attr('d', (link) => {
          return _diagonal(link);
        });

      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition(transition)
        .remove()
        .attr('d', (d) => {
          const o = { x: source.x, y: source.y };
          return _diagonal({ source: o, target: o });
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

  return (
    <div id='playground'>
      <Drawer />
    </div>
  );
}
