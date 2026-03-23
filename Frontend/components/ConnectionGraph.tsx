
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

export default function ConnectionGraph() {
  const centerX = 180;
  const centerY = 300;

  const generateCircle = (radius: number, count: number) => {
    let arr = [];
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count;
      arr.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return arr;
  };

  const tier1 = generateCircle(90, 6);
  const tier2 = generateCircle(150, 10);
  const tier3 = generateCircle(210, 12);

  return (
    <Svg height="800" width="800">

      {/* Lines */}
      {[...tier1, ...tier2, ...tier3].map((node, index) => (
        <Line
          key={index}
          x1={centerX}
          y1={centerY}
          x2={node.x}
          y2={node.y}
          stroke="#7e22ce"
          strokeWidth="1"
          opacity={0.6}
        />
      ))}

      {/* Center Node */}
<Circle cx={centerX} cy={centerY} r={40} fill="#a855f7" opacity={0.2} />
<Circle cx={centerX} cy={centerY} r={30} fill="#a855f7" />      <SvgText
        x={centerX}
        y={centerY + 4}
        fontSize="12"
        fill="#fff"
        textAnchor="middle"
      >
        You
      </SvgText>

      {/* Tier 1 */}
      {tier1.map((node, index) => (
        <>
          <Circle
            key={index}
            cx={node.x}
            cy={node.y}
            r={20}
            fill="#9333ea"
          />
          <SvgText
            x={node.x}
            y={node.y + 30}
            fontSize="10"
            fill="#aaa"
            textAnchor="middle"
          >
            User
          </SvgText>
        </>
      ))}

      {/* Tier 2 */}
      {tier2.map((node, index) => (
        <>
          <Circle
            key={index}
            cx={node.x}
            cy={node.y}
            r={16}
            fill="#7e22ce"
          />
          <SvgText
            x={node.x}
            y={node.y + 25}
            fontSize="9"
            fill="#888"
            textAnchor="middle"
          >
            User
          </SvgText>
        </>
      ))}

      {/* Tier 3 */}
      {tier3.map((node, index) => (
        <Circle
          key={index}
          cx={node.x}
          cy={node.y}
          r={12}
          fill="#6b21a8"
          opacity={0.8}
        />
      ))}
    </Svg>
  );
}