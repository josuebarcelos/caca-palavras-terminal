import React, { useState, useEffect, useCallback, useRef } from 'react';

// Tailwind CSS is assumed to be available

function App() {
    // Game state variables
    const [wordToFind, setWordToFind] = useState('');
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [grid, setGrid] = useState([]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gridSize, setGridSize] = useState(10); // Initial grid size (10x10)
    const [shuffleInterval, setShuffleInterval] = useState(10000); // Initial shuffle speed (ms)
    const [gameStarted, setGameStarted] = useState(false);
    const [message, setMessage] = useState('');

    // Cursor position state
    const [cursorRow, setCursorRow] = useState(0);
    const [cursorCol, setCursorCol] = useState(0);
    const [isCursorBlinking, setIsCursorBlinking] = useState(false); // State to control cursor blinking

    // Ref for the shuffle interval to clear it properly
    const shuffleTimerRef = useRef(null);

    // List of English words for the game
    const englishWords = [
        "HOUSE", "BALL", "CAT", "FIRE", "LIGHT", "PEACE", "SUN", "SEA", "BREAD", "TEA",
        "BOOK", "FLOWER", "BRIDGE", "CITY", "LOVE", "TIME", "GREEN", "BLUE", "HAPPY", "DREAM",
        "STAR", "MOUNTAIN", "TRAVEL", "SILENCE", "HOPE", "FREEDOM", "FUTURE", "JOY", "HEART", "MUSIC",
        "PINEAPPLE", "ELEPHANT", "COMPUTER", "UNIVERSE", "KNOWLEDGE", "IMAGINATION", "ADVENTURE", "DISCOVERY", "CREATIVITY", "INSPIRATION"
    ];

    // Function to generate a random letter
    const getRandomLetter = useCallback(() => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    }, []);

    // Function to generate a random word from the list
    const generateRandomWord = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * englishWords.length);
        return englishWords[randomIndex];
    }, [englishWords]);

    // Function to initialize or reset the grid
    const initializeGrid = useCallback((size) => {
        const newGrid = [];
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(getRandomLetter());
            }
            newGrid.push(row);
        }
        return newGrid;
    }, [getRandomLetter]);

    // Function to place the target letter in the grid
    const placeTargetLetterInGrid = useCallback((currentGrid, letter) => {
        const size = currentGrid.length;
        let placed = false;
        // Try to place the letter randomly, ensure it's not already there by chance
        while (!placed) {
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            if (currentGrid[row][col] !== letter) { // Avoid replacing the same letter with itself
                const newGrid = [...currentGrid.map(r => [...r])]; // Deep copy
                newGrid[row][col] = letter;
                setGrid(newGrid);
                placed = true;
            }
        }
    }, []);

    // Function to check if the next letter is available in the grid
    const isNextLetterAvailable = useCallback((gridToCheck, nextLetter) => {
        for (let r = 0; r < gridToCheck.length; r++) {
            for (let c = 0; c < gridToCheck[r].length; c++) {
                if (gridToCheck[r][c] === nextLetter) {
                    return true;
                }
            }
        }
        return false;
    } , []);

    // Game setup function
    const setupGame = useCallback(() => {
        setGameOver(false);
        setScore(0);
        setGridSize(10); // Set initial grid size to 10x10
        setShuffleInterval(10000); // Reset to slower initial speed
        setCurrentWordIndex(0);
        setMessage('');
        setCursorRow(0); // Reset cursor position
        setCursorCol(0); // Reset cursor position

        const newWord = generateRandomWord();
        setWordToFind(newWord);

        const initialGrid = initializeGrid(10); // Initialize with 10x10
        placeTargetLetterInGrid(initialGrid, newWord[0]); // Place the first letter
        setGrid(initialGrid);

        setGameStarted(true);
    }, [generateRandomWord, initializeGrid, placeTargetLetterInGrid]);

    // Effect for handling game start and word changes
    useEffect(() => {
        if (gameStarted && wordToFind && currentWordIndex < wordToFind.length) {
            const nextLetter = wordToFind[currentWordIndex];
            if (!isNextLetterAvailable(grid, nextLetter)) {
                setGameOver(true);
                setMessage(`Fim de Jogo! Não foi possível encontrar a letra '${nextLetter}'.`);
                if (shuffleTimerRef.current) {
                    clearInterval(shuffleTimerRef.current);
                }
            }
        } else if (gameStarted && currentWordIndex === wordToFind.length) {
            // Word completed!
            setScore(prevScore => prevScore + 1);
            setMessage('Palavra encontrada! Próxima palavra...');

            // Increase difficulty
            setGridSize(prevSize => Math.min(prevSize + 1, 10)); // Max grid size 10x10
            setShuffleInterval(prevInterval => Math.max(prevInterval - 50, 300)); // Decrease by 50ms, min 300ms

            const newWord = generateRandomWord();
            setWordToFind(newWord);
            setCurrentWordIndex(0);

            // Re-initialize grid with new size and place the first letter of the new word
            const newGrid = initializeGrid(gridSize + 1); // Use the updated gridSize
            placeTargetLetterInGrid(newGrid, newWord[0]);
            setGrid(newGrid);

            setCursorRow(0); // Reset cursor position on new word/grid
            setCursorCol(0); // Reset cursor position on new word/grid
        }
    }, [currentWordIndex, wordToFind, grid, gameStarted, isNextLetterAvailable, generateRandomWord, initializeGrid, placeTargetLetterInGrid, gridSize]);

    // Effect for letter shuffling
    useEffect(() => {
        if (gameStarted && !gameOver) {
            if (shuffleTimerRef.current) {
                clearInterval(shuffleTimerRef.current);
            }
            shuffleTimerRef.current = setInterval(() => {
                setGrid(prevGrid => {
                    const newGrid = [...prevGrid.map(r => [...r])]; // Deep copy
                    const size = newGrid.length;
                    const flatGrid = newGrid.flat(); // Flatten the grid
                    // Shuffle the flattened array
                    for (let i = flatGrid.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
                    }
                    // Reshape back to 2D grid
                    let k = 0;
                    for (let r = 0; r < size; r++) {
                        for (let c = 0; c < size; c++) {
                            newGrid[r][c] = flatGrid[k++];
                        }
                    }
                    return newGrid;
                });
            }, shuffleInterval);
        } else {
            if (shuffleTimerRef.current) {
                clearInterval(shuffleTimerRef.current);
            }
        }
        return () => {
            if (shuffleTimerRef.current) {
                clearInterval(shuffleTimerRef.current);
            }
        };
    }, [gameStarted, gameOver, shuffleInterval]);

    // Handle click on a grid cell (now also called by spacebar)
    const handleLetterClick = useCallback((clickedLetter, rowIndex, colIndex) => {
        if (gameOver || !gameStarted) return;

        const targetLetter = wordToFind[currentWordIndex];

        if (clickedLetter === targetLetter) {
            // Correct letter found
            const newGrid = [...grid.map(r => [...r])]; // Deep copy
            newGrid[rowIndex][colIndex] = getRandomLetter(); // Replace with a new random letter
            setGrid(newGrid);
            setCurrentWordIndex(prevIndex => prevIndex + 1);
        } else {
            setMessage(`Letra incorreta! Procure por '${targetLetter}'.`);
            setTimeout(() => setMessage(''), 1000); // Clear message after 1 second
        }
    }, [gameOver, gameStarted, wordToFind, currentWordIndex, grid, getRandomLetter]);

    // Keyboard navigation and selection
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!gameStarted || gameOver) return;

            const currentGridSize = grid.length;

            switch (event.key) {
                case 'ArrowUp':
                    setCursorRow(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowDown':
                    setCursorRow(prev => Math.min(currentGridSize - 1, prev + 1));
                    break;
                case 'ArrowLeft':
                    setCursorCol(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowRight':
                    setCursorCol(prev => Math.min(currentGridSize - 1, prev + 1));
                    break;
                case ' ': // Spacebar
                    event.preventDefault(); // Prevent scrolling
                    if (grid[cursorRow] && grid[cursorRow][cursorCol]) {
                        // Trigger blinking effect
                        setIsCursorBlinking(true);
                        setTimeout(() => setIsCursorBlinking(false), 200); // Blink for 200ms

                        // Simulate click on the current cursor position
                        handleLetterClick(grid[cursorRow][cursorCol], cursorRow, cursorCol);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameStarted, gameOver, cursorRow, cursorCol, grid, handleLetterClick]);


    // Render the word to find with highlighting
    const renderWordToFind = () => {
        return (
            <div className="text-2xl font-bold mb-4 text-white">
                Palavra:
                <span className="ml-2">
                    {wordToFind.split('').map((char, index) => (
                        <span
                            key={index}
                            className={`${index < currentWordIndex ? 'text-green-400' : 'text-yellow-400'}`}
                        >
                            {char}
                        </span>
                    ))}
                </span>
            </div>
        );
    };

    // Render the grid
    const renderGrid = () => {
        if (!grid.length) return null;

        return (
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg font-mono text-green-400 text-lg overflow-auto"
                 style={{
                     maxWidth: '90vw', // Limit maximum width to 90% of viewport width
                     maxHeight: '70vh', // Limit maximum height to 70% of viewport height
                     // The actual width and height will be determined by content and flex/grid layout
                     // but these max values ensure it doesn't overflow the screen without scrolling
                     // unless absolutely necessary.
                 }}>
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex">
                        {row.map((letter, colIndex) => (
                            <span
                                key={`${rowIndex}-${colIndex}`}
                                className={`
                                    w-8 h-8 flex items-center justify-center cursor-pointer
                                    transition-colors duration-150
                                    ${rowIndex === cursorRow && colIndex === cursorCol ? 'bg-blue-600 text-white border border-blue-400' : 'hover:bg-gray-700'}
                                    ${rowIndex === cursorRow && colIndex === cursorCol && isCursorBlinking ? 'animate-pulse' : ''}
                                `}
                                onClick={() => {
                                    setCursorRow(rowIndex);
                                    setCursorCol(colIndex);
                                    handleLetterClick(letter, rowIndex, colIndex);
                                }}
                            >
                                {letter}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center p-4 font-inter">
            <div className="bg-gray-700 p-8 rounded-xl shadow-2xl text-center">
                <h1 className="text-4xl font-extrabold text-white mb-6">Caça Palavras Terminal</h1>

                {gameStarted && !gameOver && (
                    <>
                        {renderWordToFind()}
                        <div className="text-xl text-gray-300 mb-4">Pontuação: {score}</div>
                        <div className="text-lg text-gray-400 mb-4">Tamanho do Grid: {gridSize}x{gridSize}</div>
                        <div className="text-lg text-gray-400 mb-4">Velocidade de Embaralhamento: {((10000 - shuffleInterval) / 50).toFixed(0)}</div>
                    </>
                )}

                {message && (
                    <div className="bg-blue-500 text-white py-2 px-4 rounded-md mb-4 animate-bounce">
                        {message}
                    </div>
                )}

                {!gameStarted && (
                    <button
                        onClick={setupGame}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
                    >
                        Iniciar Jogo
                    </button>
                )}

                {gameStarted && renderGrid()}

                {gameOver && (
                    <div className="mt-8">
                        <p className="text-3xl font-bold text-red-500 mb-4">Fim de Jogo!</p>
                        <p className="text-xl text-white mb-6">Você encontrou {score} palavras.</p>
                        <button
                            onClick={setupGame}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            Jogar Novamente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

