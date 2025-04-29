import * as d3 from 'd3';
import { useEffect } from 'react';

export default function Test() {
  function initial() {
    const container = document.querySelector('#container') as HTMLDivElement;

    const data = {
      name: 'a',
      y: 2,
      children: [
        { name: 'b', y: 1 },
        {
          name: 'c',
          y: 3,
          children: [
            { name: 'd', y: 2 },
            { name: 'e', y: 4 },
          ],
        },
      ],
    };

    const root = d3.hierarchy(data);
    const width = 400;
    const height = 200;
    const box_width = 3;
    const box_spacing = 5;

    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, 20, 10])
      .style('max-width', `${width}px`)
      .style('font', '1px mono')
      .style('border', 'solid 1px black');

    d3.tree().size([10, 20 - box_width])(root);

    const node = svg
      .append('g')
      .selectAll()
      .data(root.descendants())
      .join('g')
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    node.append('rect').attr('width', box_width).attr('height', 1).attr('fill', 'transparent').attr('y', -0.5);

    node
      .append('text')
      .text((d) => d.data.name)
      .attr('y', 0.4);

    svg
      .append('g') // link
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.1)
      .selectAll()
      .data(root.links())
      .join('path')
      .attr('d', (link) =>
        d3
          .linkHorizontal()
          .x((d) => (d.y == link.source.y ? d.y + box_width : d.y))
          .y((d) => d.x)(link)
      );

    container.append(svg.node());
  }

  useEffect(() => {
    initial();
  }, []);

  return (
    <div
      id='container'
      style={{
        width: '50vw',
        height: '50vh',
      }}
    >
      Test
    </div>
  );
}
