console.log(process.env);

function App() {
  const [selected, setSelected] = useState();

  return (
    <>
      <select onChange={setSelected} value={selectedIdx} />
      {items.map((item, idx) => (
        <ChildComp key={item.key} selected={idx === selectedIdx} />
      ))}
    </>
  );
}

function ChildComp() {
  const [x, setX] = useState();

  return <div onHover={setX} />;
}
export default memo(ChildComp)



function RandNum() {
    return <div>{Math.random()}</div>
}
export default memo(RandNum)



function Input (props) {
    return <input {...props} />
}
export default memo(Input)


function () {
    console.log("HI")
    setTimeout(() => console.log())
    console.log(2)
}


async function () {
    console.log(1)
    const resp = await callApi();
    console.log(resp);
}


function () {
    console.log(1)
    callApi().then(resp => console.log(resp));
}